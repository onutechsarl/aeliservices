import React from "react";

/**
 * UI component responsible for rendering the table section.
 */
export const Table = ({ headers, children, minWidth = "1000px" }) => (
  <div className="w-full">
    <div className="overflow-x-auto">
      <table
        className={`w-full min-w-[${minWidth}] text-left text-sm border-separate border-spacing-y-2 `}
      >
        <tbody
          className="

                    [&>tr:nth-child(odd)>td]:bg-slate-50/80
                    [&>tr:nth-child(odd)>td:first-child]:rounded-l-2xl
                    [&>tr:nth-child(odd)>td:last-child]:rounded-r-2xl


                    [&>tr:nth-child(even)>td]:bg-white
                    [&>tr:nth-child(even)>td]:border-y
                    [&>tr:nth-child(even)>td]:border-slate-200


                    [&>tr:nth-child(even)>td]:shadow-[0_1px_3px_rgba(0,0,0,0.12)]


                    [&>tr:nth-child(even)>td:first-child]:rounded-l-2xl
                    [&>tr:nth-child(even)>td:first-child]:border-l
                    [&>tr:nth-child(even)>td:last-child]:rounded-r-2xl
                    [&>tr:nth-child(even)>td:last-child]:border-r

                "
        >
          {children}
        </tbody>
      </table>
    </div>
  </div>
);
