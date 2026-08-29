import MediaCollectionManager from "@/components/admin/MediaCollectionManager";

export default function AdminStoryPage() {
  return (
    <div>
      <h1 className="display text-2xl font-bold text-ink md:text-3xl">Our Story</h1>
      <p className="mt-1 text-sm text-ink/55">
        The auto-advancing slideshow next to the Our Story text on the homepage. Mix in a farm
        video alongside the photos — it plays muted while its slide is active.
      </p>
      <div className="mt-6">
        <MediaCollectionManager
          refType="STORY"
          emptyTitle="No slides yet"
          emptySub="Add the first photo or video for the Our Story slideshow."
          helpText="Order here is the slideshow order — use the arrows to rearrange."
        />
      </div>
    </div>
  );
}
