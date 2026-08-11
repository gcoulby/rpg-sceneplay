import React from 'react'
import type { PageContentInfo } from '@/editor/pagination'
import { pageThumbTypeClasses } from './pageThumbnailLayout'

interface PageThumbnailProps {
  page: PageContentInfo
  isActive: boolean
  isLast: boolean
  contentStyle: React.CSSProperties
  thumbScale: number
  getBlockStyle: (typeName: string, isFirst: boolean) => React.CSSProperties
  onClick: (page: PageContentInfo, e: React.MouseEvent<HTMLDivElement>) => void
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  isActive,
  isLast,
  contentStyle,
  thumbScale,
  getBlockStyle,
  onClick,
}) => {
  return (
    <div className="flex flex-col mt-4 w-4/6">
      <div
        className={`page-thumbnail flex flex-col cursor-pointer overflow-hidden rounded-[2px] border m-1 transition-[border-color,box-shadow] duration-150 bg-white ${isActive ? 'border-(--fd-accent) shadow-[0_0_0_2px_rgba(74,158,255,0.4)]' : 'border-(--fd-border) hover:border-(--fd-accent) hover:shadow-[0_0_0_1px_var(--fd-accent)]'}`}
        data-page={page.pageNumber}
        onClick={(e) => onClick(page, e)}
      >
        <div className="relative w-full aspect-[8.26/11.69] overflow-hidden page-thumb-content-clip">
          <div
            className="top-0 left-0 box-border absolute text-[#222] origin-top-left page-thumb-content"
            style={{ ...contentStyle, transform: `scale(${thumbScale})` }}
          >
            {page.blocks.map((block, i) => (
              <div
                key={i}
                className={`wrap-break-word whitespace-pre-wrap ${pageThumbTypeClasses(block.typeName)}`}
                style={getBlockStyle(block.typeName, i === 0)}
              >
                {block.text || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className={`text-center text-[10px] font-semibold text-(--fd-text) opacity-50 pt-0.75 pb-1.5 mx-1 ${isLast ? '' : 'border-b border-(--fd-border)'}`}
      >
        Page {page.pageNumber}
      </div>
    </div>
  )
}

export default PageThumbnail
