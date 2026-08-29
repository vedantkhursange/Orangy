import MediaCollectionManager from "@/components/admin/MediaCollectionManager";

export default function AdminGalleryPage() {
  return (
    <div>
      <h1 className="display text-2xl font-bold text-ink md:text-3xl">Gallery</h1>
      <p className="mt-1 text-sm text-ink/55">
        Shown on the homepage gallery grid. Add photos or a short video — a video plays inline,
        muted, when a visitor scrolls it into view.
      </p>
      <div className="mt-6">
        <MediaCollectionManager
          refType="FARM_GALLERY"
          emptyTitle="Gallery is empty"
          emptySub="Add the first photo or video of the orchard."
          helpText="Order here is the order shown on the homepage — use the arrows to rearrange."
        />
      </div>
    </div>
  );
}
