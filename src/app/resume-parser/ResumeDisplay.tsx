import React from 'react';
import type { Resume } from "lib/redux/types";

interface ResumeDisplayProps {
  resumes: Resume[];
}

export const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumes }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Summary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Experience
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Education
            </th>
        </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {resumes.map((resume, index) => (
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
                {resume.profile.summary || ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.workExperiences[0]?.company && resume.workExperiences[0]?.date && resume.workExperiences[0]?.title 
                    ? `${resume.workExperiences[0].company} , ${resume.workExperiences[0].date} , ${resume.workExperiences[0].title}` 
                    : ""}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">
                {resume.educations[0]?.school && resume.educations[0]?.degree ? `${resume.educations[0].school} , ${resume.educations[0].degree}` : ""}
            </td>
            
            </tr>
        ))}
        </tbody>
    </table>
  );
};