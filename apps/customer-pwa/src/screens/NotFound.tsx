import { Link } from "react-router";
import { EmptyState } from "@mrcow/ui";

export function NotFound() {
  return <EmptyState title="Page not found" action={<Link to="/">Go home</Link>}>That page doesn't exist.</EmptyState>;
}
