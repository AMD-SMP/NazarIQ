import type { Source } from '@/types'

export const mockSources: Source[] = [
  {
    name: 'ndtv_news', displayName: 'NDTV News', reliability: 94,
    totalReports: 156, verifiedReports: 142, falseReports: 4,
    status: 'TRUSTED', trend: [12,15,10,18,14,20,16,22,19,14,17,21,15,18,13,19,22,16,20,14,18,24,17,21,15,19,23,16,20,18],
  },
  {
    name: 'times_of_india', displayName: 'Times of India', reliability: 91,
    totalReports: 203, verifiedReports: 180, falseReports: 8,
    status: 'TRUSTED', trend: [18,22,15,25,19,28,20,30,24,18,22,27,19,24,17,23,29,21,26,19,24,31,22,28,20,25,30,22,27,24],
  },
  {
    name: 'twitter_local', displayName: 'Twitter Local', reliability: 72,
    totalReports: 445, verifiedReports: 310, falseReports: 52,
    status: 'MONITORING', trend: [35,42,28,50,38,55,40,60,48,35,42,52,38,46,32,44,56,42,50,36,44,58,40,52,36,48,55,42,50,45],
  },
  {
    name: 'reddit_india', displayName: 'Reddit India', reliability: 68,
    totalReports: 312, verifiedReports: 205, falseReports: 38,
    status: 'MONITORING', trend: [20,25,18,30,22,35,24,38,28,20,25,32,22,28,19,26,34,24,30,21,27,36,25,32,22,29,35,25,31,28],
  },
  {
    name: 'citizen_report', displayName: 'Citizen Reports', reliability: 76,
    totalReports: 189, verifiedReports: 140, falseReports: 15,
    status: 'TRUSTED', trend: [8,12,6,15,10,18,12,20,15,9,13,17,10,14,8,12,19,13,16,10,14,21,13,18,11,15,20,14,17,15],
  },
  {
    name: 'municipal_feed', displayName: 'Municipal Feed', reliability: 96,
    totalReports: 98, verifiedReports: 96, falseReports: 0,
    status: 'TRUSTED', trend: [5,7,4,8,6,9,7,10,8,5,7,9,6,8,5,7,10,7,9,6,8,11,7,9,6,8,10,7,9,8],
  },
  {
    name: 'bbmp_official', displayName: 'BBMP Official', reliability: 98,
    totalReports: 67, verifiedReports: 67, falseReports: 0,
    status: 'TRUSTED', trend: [3,5,2,6,4,7,5,8,6,4,5,7,4,6,3,5,8,5,7,4,6,9,5,7,4,6,8,5,7,6],
  },
]
