export const C = {
  blue: '#2E7BC5', blueLight: '#7DB6FF', red: '#E63946', green: '#10B981', amber: '#F4B860', coral: '#F28C6B',
  violet: '#6C4AB6', teal: '#1F8A8A', ivory: '#F6EBD9', paper: '#FBF4E6', ink: '#1B1F33', muted: '#9FB3CF',
  ice: '#CFE8FF', snow: '#EEF6FF', warm: '#FFC56E',
};

/** Background of each part: [top, bottom]. Cold parts are blue, warm ones amber. */
export const SKY = {
  cold: ['#0A1430', '#1B3157'],
  huddle: ['#13183A', '#3A2E52'],
  apart: ['#07112A', '#14305A'],
  balance: ['#171A3E', '#3B2D57'],
  room: ['#2A1C35', '#5B3A4C'],
  dusk: ['#232A55', '#D9806A'],
  night: ['#111A3C', '#33285C'],
} as const;

export const SAFE = { left: 100, right: 100, top: 160, bottom: 300 };
export const W = 1080;
export const H = 1920;
