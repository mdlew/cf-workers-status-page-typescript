import { clsx } from 'clsx'
import React from 'react'

import Empty from './Empty'

import type { DataV1, MonitorAllData } from '#src/worker/_helpers/store'
import type { Monitor } from '#src/types'

import { getDisplayDays, getHistoryDates } from '#src/worker/_helpers/datetime'
import { parseLocation } from '#src/helpers/locations'
import { Tooltip, TooltipContent, TooltipTrigger } from '#src/components/Tooltip'
import { getChecksItemRenderStatus, getTargetDateChecksItem } from '#src/helpers/checks'
import Icon from '#src/components/Icon'
import Spinner from '#src/components/Spinner'

export interface IMonitorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  allMonitors: Monitor[]
  data?: DataV1 | null
  search?: string
}

const MonitorPanel: React.FC<IMonitorPanelProps> = (props) => {
  const { allMonitors, data, search, ...restDivProps } = props

  if (allMonitors.length === 0) {
    return (
      <Empty>
        No monitors
      </Empty>
    )
  }

  if (!data || !data.monitorHistoryData || Object.keys(data).length === 0) {
    return (
      <Empty>
        <Spinner className='mr-1 size-5' />
        No Data (
        {allMonitors.length}
        {' '}
        monitor(s))
      </Empty>
    )
  }

  const monitorIds = (Object.keys(data.monitorHistoryData) || [])
  const allOperational = data.lastUpdate?.checks.allOperational

  const titleCls = allOperational ? clsx('border-green-500 bg-green-300 text-green-800 dark:bg-green-800 dark:text-green-300') : clsx('border-red-500 bg-red-300 text-red-800 dark:bg-red-800 dark:text-red-300')
  return (
    <div {...restDivProps}>
      <div
        className={clsx(
          'flex items-center justify-between rounded-sm border px-4 py-2 text-lg font-bold shadow-md',
          titleCls
        )}
        onDoubleClick={() => {
          // eslint-disable-next-line no-console
          console.log('allMonitors', allMonitors)
          // eslint-disable-next-line no-console
          console.log('data', data)
        }}
      >
        <div>
          {allOperational ? 'All Systems Operational' : 'Not All Systems Operational'}
        </div>
        {!!data.lastUpdate && (
          <div className='text-xs font-light' suppressHydrationWarning title={new Date(data.lastUpdate.time).toLocaleString()}>
            checked
            {' '}
            {Math.round((Date.now() - data.lastUpdate.time) / 1000)}
            {' '}
            sec
            ago (from
            {' '}
            {parseLocation(data.lastUpdate.location)}
            )
          </div>
        )}
      </div>
      <ul className={clsx('mt-4 flex flex-col gap-y-2')}
      >
        {monitorIds.filter((item) => {
          const targetMonitor = allMonitors.find((monitorItem) => monitorItem.id === item)
          const title = targetMonitor?.name || item
          const keyword = search?.trim().toLowerCase()
          if (!keyword) {
            return true
          }

          const searchFields = [title, targetMonitor?.id, targetMonitor?.description]

          return searchFields.filter(Boolean).some((item) => item!.toLowerCase().includes(keyword.toLowerCase()))
        }).map((item) => {
          // New monitor id maybe no monitor data
          const monitorData = data.monitorHistoryData![item] as MonitorAllData | undefined
          const monitorConfig = allMonitors.find((monitorItem) => monitorItem.id === item)
          const targetMonitor = allMonitors.find((monitorItem) => monitorItem.id === item)
          const title = targetMonitor?.name || item

          const firstCheckInfo = monitorData
            ? [{
                key: 'First Check',
                value: monitorData.firstCheck,
              }]
            : []
          const lastCheckInfo = monitorData
            ? [{
                key: 'Last Check Time',
                value: monitorData.lastCheck.time ? new Date(monitorData.lastCheck.time).toLocaleString() : null,
              }, {
                key: 'Last Check Operational',
                value: monitorData.lastCheck.operational.toString(),
              }, {
                key: 'Last Check Status',
                value: `${monitorData.lastCheck.status} / ${monitorData.lastCheck.statusText}`,
              }]
            : []

          const info = [
            ...(monitorConfig
              ? [
                  { key: 'Description', value: monitorConfig?.description },
                  {
                    key: 'Method',
                    value: (monitorConfig.method || 'GET').toUpperCase(),
                  },
                  {
                    key: 'URL',
                    value: monitorConfig.url,
                  },
                  {
                    key: 'Expect Status',
                    value: monitorConfig.expectStatus || 200,
                  },
                  {
                    key: 'Follow Redirect',
                    value: (monitorConfig.followRedirect || false).toString(),
                  },
                ]
              : []),
            ...firstCheckInfo,
            ...lastCheckInfo,
          ].filter((item) => !(typeof item.value === 'undefined' || item.value === null)) as {
            key: string
            value: string | number
          }[]

          return (
            <li key={item} className={clsx('[&:not(:last-child)]:mb-2')}>
              <div className='mb-1 flex items-center gap-2'>
              <h2 className='text-slate-950 dark:text-slate-50'>
                  {title}
                </h2>
                {!!info.length && (
                  <Tooltip>
                    <TooltipTrigger className={clsx('size-5 text-slate-500 dark:text-slate-400')}>
                        <Icon name='info' className={clsx('size-full')} />
                    </TooltipTrigger>
                    <TooltipContent
                      as='ul'
                      className={clsx(
                        'list-none whitespace-pre rounded p-2',
                        'shadow-lg backdrop-blur-lg'
                      )}
                    >
                      {info.map((item) => {
                        return (
                          <li key={item.key}>
                            <span className={clsx(`font-semibold after:content-[':_']`)}>
                              {item.key}
                            </span>
                            <span>
                              {item.value}
                            </span>
                          </li>
                        )
                      })}
                    </TooltipContent>
                  </Tooltip>
                )}
                {monitorConfig
                && (!monitorConfig.method || monitorConfig.method.toUpperCase() === 'GET')
                && (
                  <a
                    className='size-5 text-slate-500 dark:text-slate-400 hover:text-slate-400'
                    href={monitorConfig.url}
                    target='_blank'
                    rel='noreferrer'
                    title='Open in new tab'
                  >
                    <Icon name='external-link' className='size-full' />
                    <span className='sr-only'>{title}</span>
                  </a>
                )}
              </div>
              <ul className='flex gap-1'>
                {getHistoryDates().map((dateItem) => {
                  const targetDateChecksItem = monitorData ? getTargetDateChecksItem(monitorData, dateItem) : undefined
                  const renderStatus = monitorData ? getChecksItemRenderStatus(monitorData, dateItem) : undefined

                  let color = clsx('bg-gray-300 dark:bg-gray-700')
                  let textColor = clsx('text-gray-300 dark:text-gray-700')
                  let statusStr: React.ReactNode = null

                  switch (renderStatus) {
                    case 'all-good':
                      color = clsx('bg-green-500 dark:bg-green-700')
                      textColor = clsx('text-green-500 dark:text-green-700')
                      statusStr = 'All good'
                      break
                    case 'all-incidents':
                      color = clsx('bg-red-700')
                      textColor = clsx('text-red-700')
                      statusStr = `${targetDateChecksItem!.fails} incident(s)`
                      break
                    case 'latest-incident':
                      color = clsx('bg-red-500 dark:bg-red-700')
                      textColor = clsx('text-red-500 dark:text-red-700')
                      statusStr = `${targetDateChecksItem!.fails} incident(s)`
                      break
                    case 'has-incident':
                      color = clsx('bg-yellow-500 dark:bg-yellow-700')
                      textColor = clsx('text-yellow-500 dark:text-yellow-700')
                      statusStr = `${targetDateChecksItem!.fails} incident(s)`
                      break
                    default:
                      break
                  }

                  const itemWidth = `calc(100% / ${getDisplayDays()})`

                  return (
                    <Tooltip key={dateItem}>
                      <TooltipTrigger
                        as='li'
                        className='h-full'
                        style={{
                          width: itemWidth,
                        }}
                      >
                        <span
                          className={clsx(
                            'rounded-sm transition-all hover:opacity-70',
                            color,
                            'block'
                          )}
                          style={{
                            height: 28,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className={clsx(
                        'whitespace-pre rounded-sm p-2 text-center text-sm',
                        'shadow-lg backdrop-blur-lg'
                      )}
                      >
                        <div className='font-semibold'>{dateItem}</div>
                        {statusStr && <div className={clsx(textColor, 'font-semibold')}>{statusStr}</div>}
                        <div />
                        {targetDateChecksItem && targetDateChecksItem.stats
                          ? Object.keys(targetDateChecksItem.stats).map((item) => {
                            const stat = targetDateChecksItem.stats![item]
                            return (
                              <div key={item}>
                                <span className={clsx(`after:content-[':_']`)}>
                                  {parseLocation(item)}
                                </span>
                                <span>
                                  <span className='font-semibold'>
                                    {(stat.totalMs / stat.count).toFixed(0)}
                                  </span>
                                  ms
                                </span>
                              </div>
                            )
                          })
                          : (
                              <div>No Data</div>
                            )}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default MonitorPanel
