import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { prisma } from "./db.js";
import { signToken, signAdminToken } from "./auth.js";
import { evidenceKey, serialFingerprint } from "./laptop-ownership-crypto.js";
import app from "../server.js";

test("single owner shop: private student intake → consent video → owner quote → seller accepts → shop acquires → only shop sells", async t => {
  const suffix=randomBytes(5).toString("hex");
  const users=[], ids=[];
  let originalId,stockId,offerId;
  const server=app.listen(0);
  await new Promise(ok=>server.once("listening",ok));
  t.after(async()=>{
    if(offerId) await prisma.laptopOffer.deleteMany({where:{id:offerId}});
    if(stockId) await prisma.laptopListing.deleteMany({where:{id:stockId}});
    if(originalId) {
      await prisma.storeIntakeQuote.deleteMany({where:{listingId:originalId}});
      await prisma.laptopListing.deleteMany({where:{id:originalId}});
    }
    await prisma.user.deleteMany({where:{id:{in:users}}});
    await new Promise(ok=>server.close(ok));
    await prisma.$disconnect();
  });
  const base="http://127.0.0.1:"+server.address().port;
  const req=async(path,{method="GET",token,data,headers={}}={})=>{
    const binary=data instanceof Uint8Array;
    const response=await fetch(base+path,{method,headers:{
      ...(token?{authorization:"Bearer "+token}:{}),
      ...(!binary&&data!==undefined?{"content-type":"application/json"}:{}),
      ...headers,
    },body:data===undefined?undefined:binary?data:JSON.stringify(data)});
    const type=response.headers.get("content-type")||"";
    return {status:response.status,body:type.includes("json")?await response.json():await response.text()};
  };
  const ownerEmail=process.env.TRADING_OWNER_EMAIL;
  assert(ownerEmail,"CI must provide a single trading owner email");
  const owner=await prisma.user.create({data:{name:"Store Admin",email:ownerEmail,role:"ADMIN",passwordHash:"test"}});
  const seller=await prisma.user.create({data:{name:"Used Laptop Seller",email:"sell-"+suffix+"@example.test",passwordHash:"test",storeIntent:"SELL_TO_STORE"}});
  const buyer=await prisma.user.create({data:{name:"Store Buyer",email:"buy-"+suffix+"@example.test",passwordHash:"test",storeIntent:"BUY_FROM_STORE"}});
  users.push(owner.id,seller.id,buyer.id);
  const ownerToken=signAdminToken(owner),sellerToken=signToken(seller),buyerToken=signToken(buyer);
  const serial="5CG"+suffix.toUpperCase();
  const original=await prisma.laptopListing.create({data:{
    sellerId:seller.id,deviceType:"LAPTOP",brand:"Lenovo",model:"ThinkPad",
    processor:"Core i5",ramGb:8,storageGb:256,storageType:"SSD",condition:"GOOD",
    faults:"None known",price:125000,location:"Campus",allowSwap:true,
    ownershipDeclared:true,serialLast4:serial.slice(-4),
    serialFingerprint:serialFingerprint(serial,evidenceKey()),
  }});
  originalId=original.id;
  const url="/api/laptops/"+originalId;
  let r=await req("/api/store/pilot");
  assert.equal(r.body.mode,"OWNER_MANAGED_STORE");
  assert.equal(r.body.independentStoresEnabled,false);
  r=await req("/api/laptops");
  assert.equal(r.status,200);
  assert.equal(r.body.items.some(x=>x.id===originalId),false);
  r=await req("/api/products");
  assert.equal(r.body.items.length,0,"Prior vendor catalogue must not compete with managed device stock");

  r=await req(url+"/offers",{method:"POST",token:buyerToken,data:{type:"BUY",amount:120000,note:"I want this"}});
  assert.equal(r.status,404,"Student-to-student buying must be blocked");
  r=await req("/api/admin/v2/store-intake/"+originalId+"/quote",{method:"POST",token:ownerToken,data:{price:98000,note:"Private shop offer pending review"}});
  assert.equal(r.status,409,"Store cannot quote without provenance and video");

  const receipt=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(64)]);
  const video=Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]),Buffer.alloc(350)]);
  r=await req(url+"/ownership-proof",{method:"POST",token:sellerToken,data:receipt,
    headers:{"content-type":"application/octet-stream","x-ownership-document-type":"PURCHASE_RECEIPT"}});
  assert.equal(r.status,201,r.body.error);
  r=await req(url+"/seller-video-challenge",{method:"POST",token:sellerToken,data:{}});
  assert.equal(r.status,200);
  const code=r.body.challenge;
  r=await req(url+"/seller-video",{method:"POST",token:sellerToken,data:video,
    headers:{"content-type":"application/octet-stream","x-seller-video-challenge":code,
      "x-seller-video-mime":"video/webm","x-seller-video-consent":"yes"}});
  assert.equal(r.status,201,r.body.error);
  r=await req("/api/admin/v2/laptop-ownership/"+originalId+"/match-identifier",
    {method:"POST",token:ownerToken,data:{identifier:serial}});
  assert.equal(r.status,200);
  assert.equal(r.body.match,true);
  r=await req("/api/admin/v2/laptop-ownership/"+originalId+"/review",{method:"POST",token:ownerToken,
    data:{decision:"REVIEWED",note:"Personally inspected lawful source and seller statement",
      serialMatched:true,provenanceChecked:true,sellerIntentConfirmed:true}});
  assert.equal(r.status,200,r.body.error);
  r=await req("/api/laptops");
  assert.equal(r.body.items.some(x=>x.id===originalId),false,"Even reviewed student intakes are never public");

  r=await req("/api/admin/v2/store-intake/"+originalId+"/quote",{method:"POST",token:buyerToken,
    data:{price:98000,note:"I am not the store owner"}});
  assert.equal(r.status,403);
  r=await req("/api/admin/v2/store-intake/"+originalId+"/quote",{method:"POST",token:ownerToken,
    data:{price:98000,note:"CampusVerse offers to buy after inspection"}});
  assert.equal(r.status,201,r.body.error);
  r=await req(url+"/store-quote",{method:"PATCH",token:buyerToken,data:{decision:"SELLER_ACCEPTED"}});
  assert.equal(r.status,403,"Only the seller can agree to the price");
  r=await req("/api/admin/v2/store-intake/"+originalId+"/acquire",{method:"POST",token:ownerToken,
    data:{resalePrice:150000,note:"Owner received device at campus desk",inspectionConfirmed:true,paymentConfirmed:true,sellerHandoverConfirmed:true}});
  assert.equal(r.status,409,"Owner cannot acquire before seller accepts");

  r=await req(url+"/store-quote",{method:"PATCH",token:sellerToken,data:{decision:"SELLER_ACCEPTED"}});
  assert.equal(r.status,200,r.body.error);
  r=await req("/api/admin/v2/store-intake/"+originalId+"/acquire",{method:"POST",token:ownerToken,
    data:{resalePrice:150000,note:"Test receipt confirmed after full device inspection",inspectionConfirmed:true,paymentConfirmed:true,sellerHandoverConfirmed:true}});
  assert.equal(r.status,201,r.body.error);
  stockId=r.body.inventoryId;
  const [stock,source,quote]=await Promise.all([
    prisma.laptopListing.findUnique({where:{id:stockId}}),
    prisma.laptopListing.findUnique({where:{id:originalId}}),
    prisma.storeIntakeQuote.findUnique({where:{listingId:originalId}}),
  ]);
  assert.equal(stock.sellerId,owner.id);
  assert.equal(stock.storeInventory,true);
  assert.equal(stock.originListingId,originalId);
  assert.equal(stock.price,150000);
  assert.equal(source.status,"CLOSED");
  assert.equal(quote.status,"ACQUIRED");

  r=await req("/api/laptops");
  assert.equal(r.body.items.some(x=>x.id===originalId),false);
  assert.equal(r.body.items.some(x=>x.id===stockId),true,"Only the acquired store device becomes visible");
  r=await req(url+"/offers",{method:"POST",token:buyerToken,data:{type:"BUY",amount:120000,note:"Attempt peer listing"}});
  assert.equal(r.status,404);
  r=await req("/api/laptops/"+stockId+"/offers",{method:"POST",token:buyerToken,
    data:{type:"BUY",amount:140000,note:"Buy through CampusVerse owner"}});
  assert.equal(r.status,201,r.body.error);
  offerId=r.body.id;

  r=await req(url+"/status",{method:"PATCH",token:sellerToken,data:{status:"ACTIVE"}});
  assert.equal(r.status,409,"Seller cannot reopen a device acquired by CampusVerse");
  r=await req(url+"/seller-video",{method:"DELETE",token:sellerToken});
  assert.equal(r.status,409,"Acquisition evidence remains for lawful audit, subject to privacy requests");
  r=await req("/api/admin/v2/store-inventory",{token:ownerToken});
  assert.equal(r.status,200);
  assert.equal(r.body.items.some(x=>x.id===stockId),true);
});
