// Undergraduate faculties and majors. Faculty names from chula.ac.th/en/academics/programs
// (Oct 2026); majors compiled by hand — verify against chula.ac.th before launch.
export const FACULTIES: { name: string; majors: string[] }[] = [
  { name: "Faculty of Allied Health Sciences", majors: ["Medical Technology", "Physical Therapy", "Nutrition and Dietetics"] },
  { name: "Faculty of Architecture", majors: ["Architecture", "Interior Architecture", "Landscape Architecture", "Thai Architecture", "Urban and Regional Planning", "Industrial Design", "Architectural Design (INDA)", "Communication Design (CommDe)"] },
  { name: "Faculty of Arts", majors: ["Thai", "English", "French", "German", "Spanish", "Italian", "Russian", "Chinese", "Japanese", "History", "Geography", "Philosophy", "Linguistics", "Library and Information Science", "Dramatic Arts", "Language and Culture (BALAC)"] },
  { name: "Faculty of Commerce and Accountancy", majors: ["Accounting", "Finance", "Marketing", "Management", "Statistics", "Actuarial Science", "Information Systems", "Business Administration (BBA)"] },
  { name: "Faculty of Communication Arts", majors: ["Communication Arts", "Communication Management (BCM)"] },
  { name: "Faculty of Dentistry", majors: ["Dentistry"] },
  { name: "Faculty of Economics", majors: ["Economics", "Economics (EBA)"] },
  { name: "Faculty of Education", majors: ["Early Childhood Education", "Elementary Education", "Secondary Education", "Art Education", "Music Education", "Health and Physical Education", "Educational Technology", "Non-Formal Education"] },
  { name: "Faculty of Engineering", majors: ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Industrial Engineering", "Chemical Engineering", "Computer Engineering", "Environmental Engineering", "Georesources and Petroleum Engineering", "Survey Engineering", "Metallurgical and Materials Engineering", "Nuclear Engineering", "Water Resources Engineering", "Computer Engineering and Digital Technology (CEDT)", "Aerospace Engineering (AERO)", "Automotive Design and Manufacturing Engineering (ADME)", "Chemical and Process Engineering (ChPE)", "Information and Communication Engineering (ICE)", "Nano Engineering (NANO)", "Robotics and Artificial Intelligence Engineering"] },
  { name: "Faculty of Fine and Applied Arts", majors: ["Visual Arts", "Thai Music", "Western Music", "Dramatic Arts", "Creative Arts"] },
  { name: "Faculty of Integrated Agriculture", majors: ["Integrated Agriculture"] },
  { name: "Faculty of Law", majors: ["Law", "Business and Tech Laws (LLBel)"] },
  { name: "Faculty of Medicine", majors: ["Medicine", "Doctor of Medicine (CU-MEDi)"] },
  { name: "Faculty of Nursing", majors: ["Nursing Science"] },
  { name: "Faculty of Pharmaceutical Sciences", majors: ["Pharmaceutical Sciences", "Pharmaceutical Care"] },
  { name: "Faculty of Political Science", majors: ["Government", "International Relations", "Public Administration", "Sociology and Anthropology", "Politics and Global Studies (PGS)"] },
  { name: "Faculty of Psychology", majors: ["Psychology", "Psychological Science (JIPP)"] },
  { name: "Faculty of Science", majors: ["Mathematics", "Computer Science", "Chemistry", "Biology", "Physics", "Botany", "Chemical Technology", "Geology", "Environmental Science", "Marine Science", "Biochemistry", "Materials Science", "Microbiology", "Imaging and Printing Technology", "Food Technology", "Applied Chemistry (BSAC)", "Biotechnology", "Industrial Science and Technology"] },
  { name: "Faculty of Sports Science", majors: ["Sports Science", "Sports Management"] },
  { name: "Faculty of Veterinary Science", majors: ["Veterinary Medicine"] },
  { name: "College of Public Health Sciences", majors: ["Public Health"] },
  { name: "College of Interdisciplinary and Integrative Studies", majors: ["Interdisciplinary program"] }
];

export type ProfileDetails = { first: string; last: string; nick: string; faculty: string; major: string };
export type ProfileErrors = Partial<Record<"first" | "last" | "nick" | "faculty" | "major", true>>;

/** Same rules on the client (for messages) and in the server action (authoritative). */
export function validateProfile(v: ProfileDetails): ProfileErrors {
  const e: ProfileErrors = {};
  if (!v.first.trim() || v.first.trim().length > 60) e.first = true;
  if (!v.last.trim() || v.last.trim().length > 60) e.last = true;
  if (v.nick.trim().length > 20) e.nick = true;
  const faculty = FACULTIES.find((f) => f.name === v.faculty);
  if (!faculty) e.faculty = true;
  if (!faculty?.majors.includes(v.major)) e.major = true;
  return e;
}
