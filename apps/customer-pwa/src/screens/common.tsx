import type { ReactNode } from "react";
import { customerMembershipFor, useSession } from "@mrcow/auth";
import { Card, EmptyState, Icon } from "@mrcow/ui";

/** The signed-in customer's Mr. Cow membership, if they have joined. */
export function useMembership() {
  const { session, organization } = useSession();
  if (session.status !== "signed_in" || organization.status !== "ready") return { me: null, organization: null, membership: undefined };
  return { me: session.me, organization: organization.organization, membership: customerMembershipFor(session.me, organization.organization.id) };
}

export function ScreenTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="screen-title">
      {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
      <h1 className="ui-display">{title}</h1>
      {children ? <p className="screen-title__lede">{children}</p> : null}
    </header>
  );
}

/** Honest placeholder for screens whose backend or UI lands in a later phase. */
export function ComingSoon({ title, icon, children, phase }: { title: string; icon: string; children: ReactNode; phase: string }) {
  return (
    <Card>
      <EmptyState icon={<Icon name={icon} size={40} />} title={title}>
        <p>{children}</p>
        <p className="ui-muted coming-soon__phase">{phase}</p>
      </EmptyState>
    </Card>
  );
}
