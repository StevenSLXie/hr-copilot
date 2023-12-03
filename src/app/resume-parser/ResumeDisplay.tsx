import React from 'react';
import type { Resume } from "lib/redux/types";

interface ResumeDisplayProps {
  resumes: Resume[];
  limit: number;
}

export const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumes, limit }) => {
  const headers = ['Name', 'Email', 'Phone', 'Location', 'Experience', 'Education', 'Summary'];
  return (
    <table className="min-w-full divide-y divide-gray-200 mt-4">
            <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {resumes.slice(0, limit).map((resume, index) => (
            <tr key={index}>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.profile.name || ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.profile.email || ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.profile.phone || ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.profile.location || ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
            {resume.workExperiences.map((workExperience, index) => {
                return workExperience.company || workExperience.date || workExperience.jobTitle 
                ? `<strong>${workExperience.company}</strong>  ${workExperience.date}  ${workExperience.jobTitle}` 
                : "";
            }).join("\n").split('\n').map((item, key) => {
                return <><span key={key} dangerouslySetInnerHTML={{ __html: item }} /><br /><br /></>
            })}
            </td>
            
            <td className="px-6 py-4 text-sm text-gray-500">
            {resume.educations.map((education, index) => {
                return education.school || education.degree || education.date 
                ? `${education.school}  ${education.degree}  ${education.date}` 
                : "";
            }).join("\n").split('\n').map((item, key) => {
                return <span key={key}>{item}<br/><br/></span>
            })}
            </td>

            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.profile.summary || ""}
            </td>
            
            </tr>
        ))}
        </tbody>
    </table>
  );
};