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

type DigestAlert = {
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
  createdAt: string;
};

type AlertDigestProps = {
  orgName: string;
  recipientName: string;
  alerts: DigestAlert[];
  appUrl: string;
};

const SEVERITY_LABEL: Record<string, string> = {
  urgent: "🔴 Urgent",
  warning: "🟡 Warning",
  info: "🔵 Info",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertDigest({ orgName, recipientName, alerts, appUrl }: AlertDigestProps) {
  const urgentCount = alerts.filter((a) => a.severity === "urgent").length;
  const preview =
    urgentCount > 0
      ? `${urgentCount} urgent alert${urgentCount !== 1 ? "s" : ""} require your attention — Nexus CRM`
      : `You have ${alerts.length} new alert${alerts.length !== 1 ? "s" : ""} — Nexus CRM`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#fafafa", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          <Heading style={{ fontSize: "22px", marginBottom: "4px", color: "#18181b" }}>
            Your daily alerts digest
          </Heading>
          <Text style={{ color: "#71717a", marginTop: "0" }}>
            Hi {recipientName}, here&apos;s a summary of alerts for <strong>{orgName}</strong>.
          </Text>

          <Section>
            {alerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "10px",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 2px",
                    fontSize: "13px",
                    color: "#71717a",
                    fontWeight: "600",
                  }}
                >
                  {SEVERITY_LABEL[alert.severity] ?? alert.severity} · {formatDate(alert.createdAt)}
                </Text>
                <Text
                  style={{
                    margin: "0 0 4px",
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#18181b",
                  }}
                >
                  {alert.title}
                </Text>
                <Text style={{ margin: "0", fontSize: "14px", color: "#52525b" }}>
                  {alert.message}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />

          <Section style={{ textAlign: "center" }}>
            <Button
              href={`${appUrl}/alerts`}
              style={{
                backgroundColor: "#18181b",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              View all alerts
            </Button>
          </Section>

          <Text
            style={{ color: "#a1a1aa", fontSize: "12px", marginTop: "24px", textAlign: "center" }}
          >
            You are receiving this because you are a member of {orgName} on Nexus CRM.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
