import { BULLET_POINTS } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points";
import { isBold } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features";
import type { Lines, Line, Subsections } from "lib/parse-resume-from-pdf/types";

/**
 * Divide lines into subsections based on difference in line gap or bold text.
 *
 * For profile section, we can directly pass all the text items to the feature
 * scoring systems. But for other sections, such as education and work experience,
 * we have to first divide the section into subsections since there can be multiple
 * schools or work experiences in the section. The feature scoring system then
 * process each subsection to retrieve each's resume attributes and append the results.
 */

export const divideSectionIntoSubsections = (lines: Lines, keywords: string[]): Subsections => {
  const isLineNewSubsectionByRules = (line: Line, prevLine: Line, keywords: string[]) => {
    if (
      !isBold(prevLine[0]) &&
      isBold(line[0]) &&
      // Ignore bullet points that sometimes being marked as bolded
      !BULLET_POINTS.includes(line[0].text)
    ) {
      return true;
    } else if (
      keywords.some((keyword) => line[0].text.toLowerCase().includes(keyword))
    ) {
    return true;
  } else {
    return false;
  }};

  let subsections = createSubsections(lines, isLineNewSubsectionByRules, keywords);

  return subsections;
};

type IsLineNewSubsection = (line: Line, prevLine: Line, keywords: string[]) => boolean;

const createSubsections = (
  lines: Lines,
  isLineNewSubsection: IsLineNewSubsection,
  keywords: string[]
): Subsections => {
  const subsections: Subsections = [];
  let subsection: Lines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0) {
      subsection.push(line);
      continue;
    }
    if (isLineNewSubsection(line, lines[i - 1], keywords)) {
      subsections.push(subsection);
      subsection = [];
    }
    subsection.push(line);
  }
  if (subsection.length > 0) {
    subsections.push(subsection);
  }
  return subsections;
};
