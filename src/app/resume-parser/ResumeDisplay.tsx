import React from 'react';
import type { Resume } from "lib/redux/types";

interface ResumeDisplayProps {
  resumes: Resume[];
}

export const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumes }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
        </tr>
      </thead>
      <tbody>
        {resumes.map((resume, index) => (
          <tr key={index}>
            <td>{resume.profile.name}</td>
            <td>{resume.profile.email}</td>
            <td>{resume.profile.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
