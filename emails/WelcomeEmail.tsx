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
  Hr,
} from "@react-email/components";

type WelcomeEmailProps = {
  firstName: string;
  orgName: string;
  appUrl: string;
};

export function WelcomeEmail({ firstName, orgName, appUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Nexus CRM — your AI-powered sales workspace is ready</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          {/* Logo */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "#6366f1",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#18181b" }}>
                Nexus CRM
              </span>
            </div>
          </div>

          <Heading style={{ fontSize: "24px", color: "#18181b", marginBottom: "8px" }}>
            Welcome, {firstName}! 🎉
          </Heading>

          <Text style={{ color: "#52525b", lineHeight: "1.7", marginTop: "0" }}>
            Your workspace <strong>{orgName}</strong> is all set. Nexus CRM gives you an AI-powered
            pipeline to close more deals — faster.
          </Text>

          <Section
            style={{
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              padding: "20px 24px",
              margin: "24px 0",
            }}
          >
            <Text style={{ margin: "0 0 12px", fontWeight: "700", color: "#18181b" }}>
              3 things to get started:
            </Text>
            {[
              { step: "1", text: "Import your contacts (CSV or add manually)" },
              { step: "2", text: "Connect your Gmail to sync emails automatically" },
              { step: "3", text: "Create your first deal in the pipeline" },
            ].map(({ step, text }) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#6366f1",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {step}
                </div>
                <Text
                  style={{ margin: "0", fontSize: "14px", color: "#52525b", lineHeight: "1.5" }}
                >
                  {text}
                </Text>
              </div>
            ))}
          </Section>

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={`${appUrl}/onboarding/setup`}
              style={{
                backgroundColor: "#6366f1",
                color: "#fff",
                padding: "12px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Set up my workspace
            </Button>
          </Section>

          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />

          <Text style={{ color: "#a1a1aa", fontSize: "12px", margin: "0" }}>
            Questions? Reply to this email — we read every message.
            <br />
            Nexus CRM · Built with ❤️ for B2B sales teams
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
