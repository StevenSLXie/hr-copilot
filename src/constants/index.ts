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

 export const VOUCHERS = [
  'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6',
  'Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2',
  'G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8',
  'W9X0Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4',
  'M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0'
]; 

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

