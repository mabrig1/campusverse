import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth, requireAdminAuth } from "./auth.js";
import { requireTradingOwner } from "./trading-owner.js";
import { getPersonalStoreOwnerId, PERSONAL_STORE_ONLY, storeNotice } from "./store-pilot.js";
const safe = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const quoteSchema = z.object({
  price: z.number().finite().min(1000).max(100_000_000),
  note: z.string().trim().min(12).max(600),
}).strict();
const responseSchema = z.object({ decision: z.enum(["SELLER_ACCEPTED","SELLER_DECLINED"]) }).strict();
const acquisitionSchema = z.object({
  inspectionConfirmed: z.literal(true),
  paymentConfirmed: z.literal(true),
  sellerHandoverConfirmed: z.literal(true),
  resalePrice: z.number().finite().min(1000).max(100_000_000),
  note: z.string().trim().min(15).max(1000),
}).strict();
const inventoryActivationSchema = z.object({
  physicalStockConfirmed: z.literal(true),
  provenanceChecked: z.literal(true),
  note: z.string().trim().min(15).max(1000),
}).strict();
const inventoryPriceSchema = z.object({price: z.number().finite().min(1000).max(100_000_000)}).strict();
const inputFail = (res,parsed) => res.status(400).json({error:parsed.error.issues[0]?.message || "Invalid request"});
const privateHeaders = (res) => res.set("Cache-Control","private, no-store, max-age=0");

const pendingStatuses=["NOT_SUBMITTED","PENDING","REVIEWED","NEEDS_MORE_INFO","REJECTED","FLAGGED","REVOKED"];
const intakeView={
  id:true,deviceType:true,brand:true,model:true,price:true,condition:true,faults:true,description:true,
  status:true,ownershipStatus:true,identifierMatchedAt:true,serialLast4:true,createdAt:true,storeInventory:true,
  location:true,sellerId:true,
  seller:{select:{id:true,name:true,email:true}},
  ownershipEvidence:{select:{id:true,documentType:true,uploadedAt:true}},
  sellerVideoEvidence:{select:{id:true,uploadedAt:true,challenge:true}},
  storeQuote:{select:{id:true,price:true,status:true,note:true,offeredAt:true,agreedAt:true,acquiredAt:true,ownerId:true}},
};

export function registerPersonalStoreRoutes(app) {
  app.get("/api/store/pilot", (_req,res) => {
    res.set("Cache-Control","no-store");
    res.json({mode:PERSONAL_STORE_ONLY?"OWNER_MANAGED_STORE":"MARKETPLACE",independentStoresEnabled:!PERSONAL_STORE_ONLY,
      message:PERSONAL_STORE_ONLY?storeNotice():"Multi-store mode is configured; launch permissions require separate implementation."});
  });

  // Offers are private to the seller; the public never sees intake prices or identities.
  app.patch("/api/laptops/:id/store-quote",requireAuth,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=responseSchema.safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const listing=await prisma.laptopListing.findUnique({where:{id:req.params.id},select:{sellerId:true,status:true,storeInventory:true}});
    if(!listing) return res.status(404).json({error:"Seller submission not found"});
    if(listing.sellerId!==req.userId) return res.status(403).json({error:"Only the submitting seller can respond"});
    if(listing.status==="CLOSED" || listing.storeInventory)
      return res.status(409).json({error:"This submission is no longer available"});
    const updated=await prisma.storeIntakeQuote.updateMany({
      where:{listingId:req.params.id,status:"OFFERED"},
      data:{status:parsed.data.decision,...(parsed.data.decision==="SELLER_ACCEPTED"?{agreedAt:new Date()}:{} )},
    });
    if(!updated.count) return res.status(409).json({error:"No active store quote to respond to"});
    res.json({status:parsed.data.decision,message:parsed.data.decision==="SELLER_ACCEPTED"
      ?"You agreed to CampusVerse's purchase quote. Payment and handover occur only at the supervised store."
      :"Quote declined. Your device is not transferred or published."});
  }));

  app.get("/api/admin/v2/store-intake",requireAdminAuth,requireTradingOwner,safe(async(_req,res)=>{
    privateHeaders(res);
    const records=await prisma.laptopListing.findMany({
      where:{storeInventory:false,status:{not:"CLOSED"}},
      select:intakeView,orderBy:{createdAt:"desc"},take:150,
    });
    res.json({ownerId:_req.userId,items:records});
  }));

  app.get("/api/admin/v2/store-inventory",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const items=await prisma.laptopListing.findMany({
      where:{sellerId:req.userId,storeInventory:true},
      select:{id:true,deviceType:true,brand:true,model:true,price:true,status:true,
        ownershipStatus:true,serialLast4:true,storeAcquiredAt:true,originListingId:true,
        condition:true,location:true,createdAt:true},
      orderBy:{storeAcquiredAt:"desc"},take:200,
    });
    res.json({items});
  }));

  app.patch("/api/admin/v2/store-inventory/:id/status",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=z.object({status:z.enum(["ACTIVE","PAUSED"])}).strict().safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const updated=await prisma.laptopListing.updateMany({
      where:{id:req.params.id,sellerId:req.userId,storeInventory:true,status:{in:["ACTIVE","PAUSED"]}},
      data:{status:parsed.data.status},
    });
    if(!updated.count) return res.status(404).json({error:"Store inventory item not available"});
    res.json({status:parsed.data.status,message:"Only your personal store stock availability was updated."});
  }));

  app.post("/api/admin/v2/store-intake/:id/quote",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=quoteSchema.safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const listing=await prisma.laptopListing.findUnique({
      where:{id:req.params.id},
      include:{ownershipEvidence:{select:{id:true}},sellerVideoEvidence:{select:{id:true}}},
    });
    if(!listing || listing.storeInventory || listing.status!=="ACTIVE")
      return res.status(404).json({error:"Seller intake not available"});
    if(listing.sellerId===req.userId) return res.status(409).json({error:"Use the owner's own-stock activation for devices you already own"});
    if(listing.ownershipStatus!=="REVIEWED" || !listing.ownershipEvidence || !listing.sellerVideoEvidence ||
       !listing.identifierMatchedAt)
      return res.status(409).json({error:"Review receipt, fresh seller video and physical identifier before making a purchase quote"});
    const existing=await prisma.storeIntakeQuote.findUnique({where:{listingId:listing.id}});
    if(existing && ["SELLER_ACCEPTED","ACQUIRED"].includes(existing.status))
      return res.status(409).json({error:"Seller has agreed or acquisition is already complete. Do not silently change the price."});
    const quote=await prisma.storeIntakeQuote.upsert({
      where:{listingId:listing.id},
      create:{listingId:listing.id,ownerId:req.userId,price:parsed.data.price,note:parsed.data.note,status:"OFFERED"},
      update:{ownerId:req.userId,price:parsed.data.price,note:parsed.data.note,status:"OFFERED",offeredAt:new Date(),agreedAt:null},
    });
    res.status(201).json({id:quote.id,price:quote.price,status:quote.status,message:"Private CampusVerse purchase quote delivered to the seller. No money or device changed hands."});
  }));

  // The owner confirms they paid the seller and physically received the item.
  // In one DB transaction, close the intake and open shop-owned inventory.
  app.post("/api/admin/v2/store-intake/:id/acquire",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=acquisitionSchema.safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const listing=await prisma.laptopListing.findUnique({
      where:{id:req.params.id},
      include:{
        storeQuote:true,
        ownershipEvidence:{select:{id:true}},
        sellerVideoEvidence:{select:{id:true}},
      },
    });
    if(!listing || listing.storeInventory || listing.status!=="ACTIVE")
      return res.status(404).json({error:"Seller submission unavailable"});
    if(listing.sellerId===req.userId) return res.status(400).json({error:"Use own-stock activation for your existing devices"});
    if(listing.ownershipStatus!=="REVIEWED" || !listing.identifierMatchedAt ||
       !listing.ownershipEvidence || !listing.sellerVideoEvidence)
      return res.status(409).json({error:"Ownership and seller-authorisation review is incomplete"});
    if(listing.storeQuote?.status!=="SELLER_ACCEPTED" || listing.storeQuote.ownerId!==req.userId)
      return res.status(409).json({error:"Seller must agree to your specific purchase price before acquisition"});
    try {
      const item=await prisma.$transaction(async tx=>{
        const consumed=await tx.storeIntakeQuote.updateMany({
          where:{id:listing.storeQuote.id,status:"SELLER_ACCEPTED"},
          data:{status:"ACQUIRED",acquiredAt:new Date(),handoverNote:parsed.data.note},
        });
        if(!consumed.count) throw Object.assign(new Error("This acquisition was already processed"),{status:409});
        const closed=await tx.laptopListing.updateMany({
          where:{id:listing.id,status:"ACTIVE",ownershipStatus:"REVIEWED",storeInventory:false},
          data:{status:"CLOSED"},
        });
        if(!closed.count) throw Object.assign(new Error("Seller submission changed during acquisition"),{status:409});
        const inventory=await tx.laptopListing.create({data:{
          sellerId:req.userId,deviceType:listing.deviceType,brand:listing.brand,model:listing.model,
          processor:listing.processor,ramGb:listing.ramGb,storageGb:listing.storageGb,
          storageType:listing.storageType,condition:listing.condition,batteryHealth:listing.batteryHealth,
          faults:listing.faults,description:listing.description,imageUrl:listing.imageUrl,
          serialLast4:listing.serialLast4,serialFingerprint:listing.serialFingerprint,
          lockStatus:listing.lockStatus,ownershipDeclared:true,ownershipStatus:"REVIEWED",
          ownershipReviewedAt:new Date(),identifierMatchedAt:listing.identifierMatchedAt,
          identifierMatchedBy:listing.identifierMatchedBy,
          price:parsed.data.resalePrice,allowSwap:listing.allowSwap,location:listing.location,
          status:"ACTIVE",storeInventory:true,storeAcquiredAt:new Date(),originListingId:listing.id,
        }});
        return inventory;
      });
      res.status(201).json({inventoryId:item.id,device:item.brand+" "+item.model,
        message:"Device purchased and received by the CampusVerse shop. Store inventory is now available to buyers. No bank API verification is claimed."});
    } catch(error) {
      if(error.status===409 || error.code==="P2002") return res.status(409).json({error:error.message});
      throw error;
    }
  }));

  // For devices already in your physical store, as opposed to seller submissions.
  app.post("/api/admin/v2/store-inventory/:id/activate",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=inventoryActivationSchema.safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const listing=await prisma.laptopListing.findUnique({
      where:{id:req.params.id},include:{ownershipEvidence:{select:{id:true}},sellerVideoEvidence:{select:{id:true}}},
    });
    if(!listing || listing.sellerId!==req.userId) return res.status(404).json({error:"Your stock listing was not found"});
    if(listing.status!=="ACTIVE" || listing.storeInventory || listing.ownershipStatus!=="REVIEWED" ||
       !listing.ownershipEvidence || !listing.sellerVideoEvidence || !listing.identifierMatchedAt)
      return res.status(409).json({error:"Owner stock requires reviewed ownership paperwork, a fresh selfie video and serial match before activation"});
    const result=await prisma.laptopListing.updateMany({
      where:{id:listing.id,sellerId:req.userId,status:"ACTIVE",ownershipStatus:"REVIEWED",storeInventory:false},
      data:{storeInventory:true,storeAcquiredAt:new Date(),ownershipReviewNote:parsed.data.note},
    });
    if(!result.count) return res.status(409).json({error:"Stock changed during activation"});
    res.json({inventoryId:listing.id,message:"Verified owner-held stock is now visible in the single CampusVerse shop."});
  }));

  app.patch("/api/admin/v2/store-inventory/:id/price",requireAdminAuth,requireTradingOwner,safe(async(req,res)=>{
    privateHeaders(res);
    const parsed=inventoryPriceSchema.safeParse(req.body);
    if(!parsed.success) return inputFail(res,parsed);
    const ownerId=await getPersonalStoreOwnerId();
    if(!ownerId) return res.status(503).json({error:"Single store owner account not configured"});
    const result=await prisma.laptopListing.updateMany({
      where:{id:req.params.id,sellerId:ownerId,storeInventory:true,status:{in:["ACTIVE","PAUSED"]}},
      data:{price:parsed.data.price},
    });
    if(!result.count) return res.status(404).json({error:"Owner stock item not found"});
    res.json({status:"UPDATED",price:parsed.data.price});
  }));
}
