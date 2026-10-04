// Faculties and units (departments, majors and international programs) from
// chula.ac.th/en/departments (Oct 2026). A unit is whatever students actually
// pick, so every faculty has at least one; single-program faculties list a unit
// named exactly like their faculty role, and desiredRoleNames dedupes it away.
//
// Cross-repo contract (owner: this file's header): a unit is stored as
// "Plain Name (CODE)" only when the code is verified, otherwise as the plain
// name. The Discord bot derives its role names from these two pure functions —
// keep them and the stored format in sync with the bot's copies:
//   facultyRole("Faculty of Engineering") === "Engineering"
//   unitRole("Civil Engineering (CE)")     === "CE"
export const FACULTIES: { name: string; majors: string[] }[] = [
  { name: "Faculty of Allied Health Sciences", majors: ["Medical Technology", "Physical Therapy", "Nutrition and Dietetics", "Radiological Technology"] },
  { name: "Faculty of Architecture", majors: ["Architecture", "Interior Architecture", "Landscape Architecture", "Urban and Regional Planning", "Industrial Design", "Housing", "Architectural Design (INDA)", "Communication Design (CommDe)"] },
  { name: "Faculty of Arts", majors: ["Thai", "English", "French", "German", "Spanish", "Italian", "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Vietnamese", "Arabic", "Malay", "Burmese", "South Asian", "History", "Geography", "Philosophy", "Linguistics", "Library and Information Science", "Dramatic Arts", "Comparative Literature", "Language and Culture (BALAC)"] },
  { name: "Faculty of Commerce and Accountancy", majors: ["Accounting", "Commerce", "Banking and Finance", "Marketing", "Statistics", "Business Administration (BBA)"] },
  { name: "Faculty of Communication Arts", majors: ["Journalism and New Media", "Media Design and Production", "Public Relations", "Advertising", "Speech Communication", "Performing Arts", "Cinematic Arts", "Communication Management (BCM)"] },
  { name: "Faculty of Dentistry", majors: ["Dentistry"] },
  { name: "Faculty of Economics", majors: ["Economics", "Economics (EBA)"] },
  { name: "Faculty of Education", majors: ["Early Childhood Education", "Elementary Education", "Secondary Education", "Art Education", "Music Education", "Health and Physical Education", "Educational Technology", "Non-Formal Education"] },
  { name: "Faculty of Engineering", majors: ["Civil Engineering (CE)", "Electrical Engineering (EE)", "Mechanical Engineering (ME)", "Industrial Engineering (IE)", "Chemical Engineering (ChE)", "Computer Engineering (CP)", "Environmental Engineering (ENV)", "Mining and Petroleum Engineering", "Survey Engineering (SV)", "Metallurgical and Materials Engineering", "Nuclear Engineering", "Computer Engineering and Digital Technology (CEDT)", "Aerospace Engineering (AERO)", "Automotive Design and Manufacturing Engineering (ADME)", "Chemical and Process Engineering (ChPE)", "Information and Communication Engineering (ICE)", "Nano Engineering (NANO)", "Robotics and Artificial Intelligence Engineering", "Semiconductor Engineering"] },
  { name: "Faculty of Fine and Applied Arts", majors: ["Visual Arts", "Creative Arts", "Music", "Dance"] },
  { name: "Faculty of Integrated Agriculture", majors: ["Integrated Agriculture"] },
  { name: "Faculty of Law", majors: ["Law", "Business and Tech Laws (LLBel)"] },
  { name: "Faculty of Medicine", majors: ["Medicine", "Doctor of Medicine (CU-MEDi)"] },
  { name: "Faculty of Nursing", majors: ["Nursing"] },
  { name: "Faculty of Pharmaceutical Sciences", majors: ["Pharmaceutical Care", "Industrial Pharmacy"] },
  { name: "Faculty of Political Science", majors: ["Government", "International Relations (IR)", "Public Administration", "Sociology and Anthropology", "Politics and Global Studies (PGS)"] },
  { name: "Faculty of Psychology", majors: ["Psychology", "Psychological Science (JIPP)"] },
  { name: "Faculty of Science", majors: ["Mathematics", "Computer Science (CS)", "Chemistry", "Biology", "Physics", "Botany", "Chemical Technology", "Geology", "Environmental Science", "Marine Science", "Biochemistry", "Materials Science", "Microbiology", "Imaging and Printing Technology", "Food Technology", "Applied Chemistry (BSAC)", "Biotechnology", "Industrial Science and Technology"] },
  { name: "Faculty of Sports Science", majors: ["Sports Science", "Sports Management", "Health Promotion", "Recreation and Tourism"] },
  { name: "Faculty of Veterinary Science", majors: ["Veterinary Science"] },
  { name: "College of Public Health Sciences", majors: ["Public Health Sciences"] },
  { name: "College of Interdisciplinary and Integrative Studies", majors: ["Interdisciplinary and Integrative Studies"] },
  { name: "School of Integrated Innovation", majors: ["Integrated Innovation (BAScii)"] }
];

/** Faculty role name: the faculty name without its "… of " prefix. */
export function facultyRole(faculty: string): string {
  return faculty.replace(/^(Faculty|College|School) of /, "");
}

/** Unit role name: the verified code in the trailing parentheses, else the whole stored name. */
export function unitRole(unit: string): string {
  return unit.match(/\(([A-Za-z][A-Za-z-]*)\)$/)?.[1] ?? unit;
}

export type StudyLevel = "undergraduate" | "graduate";

/** The level choice, in the order the form and the database column use. */
export const STUDY_LEVELS: { value: StudyLevel; label: string }[] = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" }
];

export type ProfileDetails = { first: string; last: string; nick: string; level: StudyLevel; faculty: string; major: string };
export type ProfileErrors = Partial<Record<"first" | "last" | "nick" | "level" | "faculty" | "major", true>>;

/** Same rules on the client (for messages) and in the server action (authoritative). */
export function validateProfile(v: ProfileDetails): ProfileErrors {
  const e: ProfileErrors = {};
  if (!v.first.trim() || v.first.trim().length > 60) e.first = true;
  if (!v.last.trim() || v.last.trim().length > 60) e.last = true;
  if (v.nick.trim().length > 20) e.nick = true;
  if (v.level !== "undergraduate" && v.level !== "graduate") e.level = true;
  const faculty = FACULTIES.find((f) => f.name === v.faculty);
  if (!faculty) e.faculty = true;
  if (!faculty?.majors.includes(v.major)) e.major = true;
  return e;
}
