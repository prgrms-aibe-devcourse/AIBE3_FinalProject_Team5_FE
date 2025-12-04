import EditPostForm from "./editPostFrom";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;

  return <EditPostForm id={id} />;
}
