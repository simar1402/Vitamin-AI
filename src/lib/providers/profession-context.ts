import type { ProfessionId } from "./profession-config";

/**
 * Broad profession-field vocabulary for natural headlines.
 * Paired with an AI signal, these prove the story is about the user's domain.
 */
export const PROFESSION_CONTEXT: Record<ProfessionId, string[]> = {
  teacher: [
    "school", "schools", "classroom", "education", "edtech", "ed-tech",
    "teacher", "teachers", "teaching", "educator", "educators",
    "student", "students", "k-12", "k12", "curriculum", "lesson",
    "learning", "tutor", "tutoring", "academic", "university", "college",
    "khan academy", "pedagogy", "instruction", "coursework", "syllabus",
  ],
  doctor: [
    "healthcare", "medical", "clinical", "patient", "patients", "hospital",
    "physician", "doctor", "doctors", "diagnosis", "diagnostic", "treatment",
    "medicine", "pharma", "pharmaceutical", "radiology", "surgery",
    "nursing", "ehr", "telehealth", "biotech", "therapeutic",
  ],
  lawyer: [
    "legal", "lawyer", "lawyers", "law firm", "litigation", "contract",
    "compliance", "regulation", "regulatory", "court", "judicial",
    "intellectual property", "gdpr", "policy", "statute", "legaltech",
  ],
  "software-engineer": [
    "developer", "developers", "engineering", "software", "code", "coding",
    "programming", "devops", "backend", "frontend", "api", "github",
    "open source", "infrastructure", "database", "cloud", "sdk",
  ],
  "product-manager": [
    "product", "roadmap", "pm ", "product manager", "saas", "b2b",
    "feature", "backlog", "stakeholder", "discovery", "analytics",
    "retention", "activation", "growth", "plg", "kpi",
  ],
  "product-designer": [
    "design", "designer", "ux", "ui", "figma", "prototype", "wireframe",
    "design system", "usability", "interaction", "visual design", "user research",
  ],
  "content-designer": [
    "content", "content writer", "content writing", "copywriter", "copywriting",
    "ux writing", "ux writer", "technical writer", "technical writing",
    "microcopy", "editorial", "documentation", "help center", "knowledge base",
    "style guide", "voice and tone", "plain language", "headline", "blog",
    "newsletter", "article", "copy", "content strategy", "content marketing",
    "brand voice", "readability", "product copy", "marketing copy",
    "information architecture", "content operations", "technical documentation",
  ],
  sales: [
    "sales", "revenue", "pipeline", "prospecting", "outbound", "crm",
    "gtm", "go-to-market", "b2b", "sdr", "bdr", "quota", "deal",
    "customer", "buyer", "conversion", "lead generation",
  ],
  entrepreneur: [
    "startup", "founder", "founders", "entrepreneur", "venture", "funding",
    "bootstrap", "saas", "mvp", "indie", "business", "company build",
  ],
};

export function getProfessionContext(professionId: string): string[] {
  return PROFESSION_CONTEXT[professionId as ProfessionId] ?? [];
}
