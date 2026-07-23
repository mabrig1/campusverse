import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Pin, Star, Sparkles } from "lucide-react";
import { api } from "../api";
import { useCampusConfig } from "./useCampusConfig";

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  description: z.string().min(10, "Add a bit more detail"),
  price: z.coerce.number().positive("Enter a price greater than zero"),
  category: z.string().min(1, "Choose a category"),
  conditionType: z.enum(["NEW", "USED"]),
  condition: z.string().min(2, "Add a short condition note"),
  location: z.string().min(1, "Choose a campus location"),
  images: z.array(z.object({ url: z.string().url("Enter a valid image URL") })).min(1, "Add at least one image"),
  inspectionRequired: z.boolean().optional(),
  promotionTier: z.enum(["NONE", "PINNED", "HIGHLIGHTED", "FEATURED"]),
  promotionDays: z.coerce.number().int().min(1).max(30),
});

const TIER_INFO = {
  PINNED: { label: "Pin Listing", icon: Pin },
  HIGHLIGHTED: { label: "Highlight Listing", icon: Star },
  FEATURED: { label: "Featured Listing", icon: Sparkles },
};

export default function SellListingForm({ onClose, onCreated, showToast }) {
  const config = useCampusConfig();
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      category: config?.categories?.[0] || "",
      conditionType: "USED",
      condition: "",
      location: config?.locations?.[0] || "",
      images: [{ url: "" }],
      inspectionRequired: false,
      promotionTier: "NONE",
      promotionDays: 1,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "images" });

  useEffect(() => {
    if (!config) return;
    reset((prev) => ({
      ...prev,
      category: prev.category || config.categories[0],
      location: prev.location || config.locations[0],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const promotionTier = watch("promotionTier");
  const promotionDays = watch("promotionDays") || 1;
  const promotionCost = promotionTier !== "NONE" && config ? config.pricing[promotionTier] * promotionDays : 0;

  const onSubmit = async (values) => {
    try {
      const product = await api.createProduct({
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        conditionType: values.conditionType,
        condition: values.condition,
        location: values.location,
        images: values.images.map((i) => i.url),
        inspectionRequired: values.inspectionRequired,
      });

      if (values.promotionTier !== "NONE") {
        try {
          await api.promoteProduct(product.id, values.promotionTier, values.promotionDays);
        } catch (err) {
          showToast(`Listing published, but promotion failed: ${err.message}`);
          onCreated(product);
          return;
        }
      }

      showToast("Listing published to the marketplace!");
      onCreated(product);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="cv-market">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <input className="market-input" placeholder="Title" {...register("title")} />
          {errors.title && <span className="market-field-error">{errors.title.message}</span>}
        </div>

        <div>
          <textarea className="market-input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Description" {...register("description")} />
          {errors.description && <span className="market-field-error">{errors.description.message}</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <input className="market-input" type="number" min="1" placeholder="Price (₦)" {...register("price")} />
            {errors.price && <span className="market-field-error">{errors.price.message}</span>}
          </div>
          <select className="market-input" {...register("category")}>
            {config?.categories?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select className="market-input" {...register("conditionType")}>
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
          <select className="market-input" {...register("location")}>
            {config?.locations?.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input className="market-input" placeholder="Condition note (e.g. Like new, minor scratch)" {...register("condition")} />
          {errors.condition && <span className="market-field-error">{errors.condition.message}</span>}
        </div>

        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Images</label>
          {fields.map((field, index) => (
            <div key={field.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input className="market-input" placeholder="Image URL" {...register(`images.${index}.url`)} />
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} aria-label="Remove image" className="market-chip">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {errors.images && <span className="market-field-error">{errors.images.message || errors.images.root?.message}</span>}
          {fields.length < 6 && (
            <button type="button" onClick={() => append({ url: "" })} className="market-chip" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={13} /> Add another image
            </button>
          )}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" {...register("inspectionRequired")} />
          Request a CampusVerse Hub inspection (recommended for electronics)
        </label>

        <div style={{ borderTop: "1px solid var(--market-border)", paddingTop: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>Promotion (optional)</label>
          <Controller
            control={control}
            name="promotionTier"
            render={({ field }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="radio"
                    checked={field.value === "NONE"}
                    onChange={() => field.onChange("NONE")}
                  />
                  Don't promote
                </label>
                {Object.entries(TIER_INFO).map(([tier, info]) => (
                  <label key={tier} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input type="radio" checked={field.value === tier} onChange={() => field.onChange(tier)} />
                    <info.icon size={14} /> {info.label} — ₦{config?.pricing?.[tier] ?? "…"}/day
                  </label>
                ))}
              </div>
            )}
          />
          {promotionTier !== "NONE" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <label style={{ fontSize: 12 }}>Days:</label>
              <input className="market-input" style={{ width: 70 }} type="number" min="1" max="30" {...register("promotionDays")} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total: ₦{promotionCost.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn market-btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
            {isSubmitting ? "Publishing…" : "Publish Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
