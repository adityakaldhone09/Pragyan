export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground max-w-md">
        This page is coming soon. The features and functionality for this section are currently under development.
      </p>
    </div>
  );
}
