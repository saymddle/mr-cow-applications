import { useSession } from "@mrcow/auth";
import { Button, Card } from "@mrcow/ui";
import { ScreenTitle, useMembership } from "./common";

export function AccountScreen() {
  const { signOut } = useSession();
  const { me, membership } = useMembership();
  if (!me) return null;
  const name = [me.user.firstName, me.user.lastName].filter(Boolean).join(" ");
  return (
    <div className="ui-stack">
      <ScreenTitle title="Account" />
      <Card>
        <dl className="details">
          {name ? (<><dt>Name</dt><dd>{name}</dd></>) : null}
          <dt>Email</dt>
          <dd>{me.user.email}{me.user.emailVerified ? "" : " (not verified)"}</dd>
          {membership ? (<><dt>Member number</dt><dd>{membership.membershipNumber}</dd><dt>Member since</dt><dd>{new Date(membership.joinedAt).toLocaleDateString()}</dd></>) : null}
        </dl>
      </Card>
      <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
    </div>
  );
}
