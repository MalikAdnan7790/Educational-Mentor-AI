import { SessionView } from "@/components/session/session-view";

export default function SessionPage({ params }: { params: { id: string } }) {
  return <SessionView sessionId={params.id} />;
}
