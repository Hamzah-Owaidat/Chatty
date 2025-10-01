import StatusPage from "@/components/common/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      code={404}
      title="Page Not Found"
      message="Sorry, the page you are looking for doesn’t exist."
    />
  );
}
