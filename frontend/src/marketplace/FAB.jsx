import { useState } from "react";
import { Plus, Tag, Briefcase, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAB({ onSellProduct, onOfferService }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="cv-market">
      <AnimatePresence>
        {open && (
          <motion.div
            className="market-fab-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              className="btn market-btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              onClick={() => {
                setOpen(false);
                onSellProduct();
              }}
            >
              <Tag size={15} /> Sell a Product
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
              onClick={() => {
                setOpen(false);
                onOfferService();
              }}
            >
              <Briefcase size={15} /> Offer a Service
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button className="market-fab" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close" : "Create a listing"} aria-expanded={open}>
        {open ? <X size={24} /> : <Plus size={26} />}
      </button>
    </div>
  );
}
