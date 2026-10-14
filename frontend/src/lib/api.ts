import type { SolutionFeedback } from "@/types/evaluation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Send an image (and optional problem statement) to the backend
 * for Socratic evaluation.
 */
export async function evaluateSolution(
  file: File,
  problemStatement?: string,
): Promise<SolutionFeedback> {
  const formData = new FormData();
  formData.append("file", file);
  if (problemStatement?.trim()) {
    formData.append("problem_statement", problemStatement.trim());
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/evaluate`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(0, "Серверге қосылу мүмкін болмады. Интернет байланысын тексеріңіз.");
  }

  if (!res.ok) {
    let detail = "Белгісіз қате орын алды.";
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore parse errors */
    }

    if (res.status === 413) {
      detail = "Файл өлшемі тым үлкен. Максимум 8 МБ рұқсат етіледі.";
    } else if (res.status === 400) {
      detail = detail || "Файл форматы қолдау көрсетілмейді. JPEG, PNG немесе WebP жүктеңіз.";
    } else if (res.status === 503) {
      detail = "Сервис уақытша қолжетімсіз. Біраздан соң қайталап көріңіз.";
    }

    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<SolutionFeedback>;
}
