import type { Config } from './types'

export const config: Config = {
  settings: {
    title: 'Lew Lab Web Status',
    url: 'https://cf-worker-status-page-typescript-production.mdlew.workers.dev/',
    displayDays: 90,
    collectResponseTimes: true,
  },
  monitors: [
    {
      id: 'lewlab.wustl.edu',
      url: 'https://lewlab.wustl.edu/',
      name: 'Lew Lab main',
      followRedirect: true,
    },
    {
      id: 'github.com.Lew.Lab',
      url: 'https://github.com/Lew-Lab',
      name: 'Lew Lab GitHub',
      followRedirect: false,
    },
    {
      id: 'figshare.com.Lew_Lab_videos',
      url: 'https://figshare.com/projects/Lew_Lab_videos/250634',
      name: 'Lew Lab figshare videos',
      followRedirect: true,
    },
    {
      id: 'osfi.io.utjmr',
      url: 'https://osf.io/utjmr/',
      name: 'Lew Lab OSF',
      followRedirect: true,
    },
    {
      id: 'osf.io.download.3t7xj',
      url: 'https://osf.io/download/3t7xj/',
      name: 'Lew Lab OSF-Box download',
      followRedirect: true,
    },
    {
      id: 'lewlab.com',
      url: 'https://lewlab.com/',
      name: 'Lew Lab mirror',
      followRedirect: false,    },
    {
      id: 'ip.lewlab.com.favicon.ico',
      url: 'https://ip.lewlab.com/favicon.ico',
      name: 'This status page',
      followRedirect: false,    },
  ],
  monitorsCsvUrl: '',
  //monitorsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnewwW9OuXgtuutyYSfFJ_AZdI-UpkUjP2wWi-zZWM3MKa8IzBceWCe9qB_-Lmk-S7mSFgqKVnokam/pub?gid=0&single=true&output=csv',
}
