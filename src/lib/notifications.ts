const NTFY_TOPIC_URL = "https://ntfy.sh/bbg-lager-14787";

interface NotificationOptions {
  title: string;
  message: string;
  tags?: string;
  priority?: "min" | "low" | "default" | "high" | "max";
}

export async function sendNtfyNotification({
  title,
  message,
  tags,
  priority = "default",
}: NotificationOptions) {
  try {
    const response = await fetch(NTFY_TOPIC_URL, {
      method: "POST",
      headers: {
        Title: title,
        Priority: priority,
        ...(tags ? { Tags: tags } : {}),
        "Content-Type": "text/plain",
      },
      body: message,
    });

    if (!response.ok) {
      throw new Error(`ntfy request failed with status ${response.status}`);
    }
  } catch (error) {
    console.warn("Failed to send ntfy notification:", error);
  }
}

