// Central route table — import these constants instead of hardcoding strings.
export const paths = {
  login: '/login',

  // Employee (and Manager) area
  myDay: '/',
  attendance: '/attendance',
  reports: '/reports',

  // Manager-only area
  team: '/team',
  reviews: '/reviews',

  // System
  forbidden: '/403',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]
