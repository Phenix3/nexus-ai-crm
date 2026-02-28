import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type InviteEmailProps = {
  orgName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
};

export function InviteEmail({ orgName, inviterName, role, inviteUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {orgName} on Nexus CRM
      </Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "8px" }}>
            You&apos;ve been invited to join {orgName}
          </Heading>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            {inviterName} has invited you to join <strong>{orgName}</strong> as a{" "}
            <strong>{role}</strong> on Nexus CRM.
          </Text>
          <Section style={{ margin: "32px 0" }}>
            <Button
              href={inviteUrl}
              style={{
                backgroundColor: "#18181b",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Accept invitation
            </Button>
          </Section>
          <Text style={{ color: "#a1a1aa", fontSize: "13px" }}>
            This invitation expires in 7 days. If you didn&apos;t expect this email, you can safely
            ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
