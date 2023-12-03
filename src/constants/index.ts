import type { Resume } from "lib/redux/types";

export const LIMITS = {
    NUM_RESUMES: 100,
    GPT_TIMEOUT: 35, // a timer inside callGpt, not the maxDuration
    LINE_LIMIT: 300,
    PIXEL_WIDTH_LIMIT: 400,
    DEFAULT_WAITTIME: 25000,
    DEFAULT_DISPLAY_LIMIT: 3,
    MAX_INT: 1000000
  };

  export const DUMMY_RESUME: Resume = {
    profile: {
      name: "DummyDummy",
      email: "",
      phone: "",
      url: "",
      summary: "",
      location: ""
    },
    workExperiences: [],
    educations: [],
    projects: [],
    skills: {
      featuredSkills: [],
      descriptions: []
    },
    custom: {
      descriptions: []
    }
  };

