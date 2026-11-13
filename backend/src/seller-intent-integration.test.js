import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { prisma } from "./db.js";
import { signToken, signAdminToken } from "./auth.js";
import { evidenceKey, serialFingerprint } from "./laptop-ownership-crypto.js";
import app from "../server.js";

test("seller authorises sale by document + fresh selfie; owner manually approves; deleting video revokes visibility", async t => {
  const suffix = randomBytes(5).toString("hex");
  const sellerEmail = "seller-" + suffix + "@example.test";
  const strangerEmail = "other-" + suffix + "@example.test";
  const ownerEmail = String(process.env.TRADING_OWNER_EMAIL);
  assert(ownerEmail && ownerEmail.includes("@"),"Configure isolated test owner account");
  const created = [];
  let listingId;
  const server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  t.after(async () => {
    if (listingId) await prisma.laptopListing.deleteMany({ where: { id: listingId } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  });
  const base = "http://127.0.0.1:" + server.address().port;
  const send = async (path,{ method="GET",token,body,headers={} }={}) => {
    const res = await fetch(base+path,{method,
      headers: { ...(token ? {authorization:"Bearer "+token}:{}),
        ...(body && !(body instanceof Uint8Array) ? {"content-type":"application/json"}:{}), ...headers },
      body: body ? body instanceof Uint8Array ? body : JSON.stringify(body) : undefined,
    });
    const type=res.headers.get("content-type")||"";
    const data=type.includes("json")?await res.json():await res.arrayBuffer();
    return {status:res.status,data,headers:res.headers};
  };
  const user=await prisma.user.create({data:{name:"Seller Tester",email:sellerEmail,passwordHash:"test"}});
  const stranger=await prisma.user.create({data:{name:"Stranger Tester",email:strangerEmail,passwordHash:"test"}});
  const owner=await prisma.user.create({data:{name:"Trading Owner",email:ownerEmail,passwordHash:"test",role:"ADMIN"}});
  created.push(user.id,stranger.id,owner.id);
  const sellerToken=signToken(user), strangerToken=signToken(stranger), adminToken=signAdminToken(owner);
  const serial="5CG"+suffix.toUpperCase();
  const record=await prisma.laptopListing.create({data:{
    sellerId:user.id, deviceType:"LAPTOP",brand:"Dell",model:"Latitude",
    processor:"Core i5 8th Gen",ramGb:8,storageGb:256,storageType:"SSD",condition:"GOOD",
    faults:"None known",price:150000,location:"UNN, Nsukka",allowSwap:true,ownershipDeclared:true,
    serialLast4:serial.slice(-4),serialFingerprint:serialFingerprint(serial,evidenceKey()),
  }});
  listingId=record.id;
  const listingPath="/api/laptops/"+record.id;
  const document=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(32)]);
  const video=Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]),Buffer.alloc(256)]);

  let result=await send("/api/laptops");
  assert.equal(result.data.items.some(x=>x.id===record.id),false);
  result=await send(listingPath+"/seller-video-challenge",{method:"POST",token:sellerToken,body:{}});
  assert.equal(result.status,409,"No challenge without proof of ownership");

  result=await send(listingPath+"/ownership-proof",{method:"POST",token:sellerToken,body:document,
    headers:{"content-type":"application/octet-stream","x-ownership-document-type":"PURCHASE_RECEIPT"}});
  assert.equal(result.status,201,result.data.error);

  result=await send(listingPath+"/seller-video-challenge",{method:"POST",token:strangerToken,body:{}});
  assert.equal(result.status,403,"Other users cannot issue challenge");
  result=await send(listingPath+"/seller-video-challenge",{method:"POST",token:sellerToken,body:{}});
  assert.equal(result.status,200,result.data.error);
  const code=result.data.challenge;
  assert.match(code,/^[A-F0-9]{8}$/);
  assert.match(result.data.prompt,/I personally authorise/);

  result=await send(listingPath+"/seller-video",{method:"POST",token:sellerToken,body:video,
    headers:{"content-type":"application/octet-stream","x-seller-video-challenge":code,
      "x-seller-video-mime":"video/webm"}});
  assert.equal(result.status,400,"Explicit seller consent is mandatory");
  result=await send(listingPath+"/seller-video",{method:"POST",token:sellerToken,body:video,
    headers:{"content-type":"application/octet-stream","x-seller-video-challenge":"00000000",
      "x-seller-video-mime":"video/webm","x-seller-video-consent":"yes"}});
  assert.equal(result.status,409,"Wrong video challenge fails");

  result=await send(listingPath+"/seller-video",{method:"POST",token:sellerToken,body:video,
    headers:{"content-type":"application/octet-stream","x-seller-video-challenge":code,
      "x-seller-video-mime":"video/webm","x-seller-video-consent":"yes"}});
  assert.equal(result.status,201,result.data.error);

  const saved=await prisma.laptopSellerVideoEvidence.findUnique({where:{listingId:record.id}});
  assert(saved?.cipherText && saved.cipherText.length>0,"Encrypted evidence was persisted");
  assert(!saved.cipherText.equals(video),"Stored evidence must not be plaintext");

  result=await send(listingPath+"/seller-video",{method:"POST",token:sellerToken,body:video,
    headers:{"content-type":"application/octet-stream","x-seller-video-challenge":code,
      "x-seller-video-mime":"video/webm","x-seller-video-consent":"yes"}});
  assert.equal(result.status,409,"Consumed challenge cannot be reused");

  result=await send("/api/admin/v2/laptop-ownership/"+record.id+"/seller-video",{token:strangerToken});
  assert.equal(result.status,403,"Student cannot download video");
  result=await send("/api/admin/v2/laptop-ownership/"+record.id+"/seller-video",{token:adminToken});
  assert.equal(result.status,200,"Trading owner can download");
  assert.equal(Buffer.from(result.data).equals(video),true,"Decrypts correct video only for owner");
  assert.match(result.headers.get("cache-control"),/no-store/);

  result=await send("/api/admin/v2/laptop-ownership/"+record.id+"/review",{method:"POST",token:adminToken,
    body:{decision:"REVIEWED",note:"Receipt, serial and provenance checked",serialMatched:true,provenanceChecked:true,sellerIntentConfirmed:false}});
  assert.equal(result.status,409,"Owner cannot approve without confirming video");
  result=await send("/api/admin/v2/laptop-ownership/"+record.id+"/match-identifier",{method:"POST",token:adminToken,
    body:{identifier:serial}});
  assert.equal(result.status,200);
  assert.equal(result.data.match,true);

  result=await send("/api/admin/v2/laptop-ownership/"+record.id+"/review",{method:"POST",token:adminToken,
    body:{decision:"REVIEWED",note:"Personally checked selfie video and transfer records",serialMatched:true,provenanceChecked:true,sellerIntentConfirmed:true}});
  assert.equal(result.status,200,result.data.error);
  result=await send("/api/laptops");
  assert.equal(result.data.items.some(x=>x.id===record.id),true,"Only after review does device become visible");

  result=await send(listingPath+"/seller-video",{method:"DELETE",token:strangerToken});
  assert.equal(result.status,403);
  result=await send(listingPath+"/seller-video",{method:"DELETE",token:sellerToken});
  assert.equal(result.status,200);
  result=await send("/api/laptops");
  assert.equal(result.data.items.some(x=>x.id===record.id),false,"Erasing video revokes approval immediately");
  assert.equal(await prisma.laptopSellerVideoEvidence.count({where:{listingId:record.id}}),0);
});
