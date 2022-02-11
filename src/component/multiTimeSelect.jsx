/*
 * @Autor: Ekalos
 * @Date: 2022-01-26 16:45:13
 * @LastEditors: Ekalos
 * @LastEditTime: 2022-02-11 18:04:56
 */
import {
  memo,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import styled from "styled-components";
const weekStr = {
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
const axisStr = {
  zh: { y: "星期", x: "时间" },
  en: { y: "Week", x: "Time" },
};

const colspan = 2;
const color = "rgb(220, 220, 220)";

const SelectTable = styled.div`
  position: relative;
  .select-mask {
    position: absolute;
    background-color: rgba(89, 143, 230, 0.5);
    pointer-events: none;
  }
  .mask-ani {
    transition: all 0.1s ease-in-out;
  }
  table {
    border-collapse: collapse;
    user-select: none;
    th,
    td {
      min-width: 8px;
      height: 0;
      border: 1px solid ${color};
      line-height: 1.8em;
      font-size: 13px;
      text-align: center;
    }
    .row-head {
      pointer-events: none;
    }
    .selectTh {
      background-color: #f5f5f5;
    }
    .selectedTh {
      background-color: #598fe6;
    }
    .table-header {
      position: relative;
      min-width: 3.6em;
      background: #fff
        url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><line x1="0" y1="0" x2="100%" y2="100%" stroke="${color}" stroke-width="1"/></svg>')
        no-repeat 100% center;
      height: 100%;
      .y-axis {
        position: absolute;
        bottom: 0;
        left: 0;
      }
      .x-axis {
        position: absolute;
        top: 0;
        right: 0;
      }
    }
  }
`;

const useTimeTransform = (timeSlice) => {
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const newSelected = [];
    timeSlice?.forEach((item) => {
      const start = Math.floor((item.hour + item.minute / 60) * colspan);
      const end = Math.ceil(
        (item.hour + (item.minute + (item.second + item.duration) / 60) / 60) *
          colspan
      );
      if (newSelected[item.week]) newSelected[item.week] = [];
      for (let i = start; i < end; i++) {
        newSelected[item.week][i] = true;
      }
    });
    setSelected(newSelected);
  }, [timeSlice]);
  const selectedSlice = useMemo(() => {
    const newSlice = [];
    let now = null;
    selected?.forEach((_, day) => {
      _.forEach((item, index) => {
        if (item) {
          if (!now) {
            now = {
              week: day,
              hour: Math.floor(index / colspan),
              minute: ((index % colspan) * 60) / colspan,
              duration: 0,
            };
          }
          now.duration += 3600 / colspan;
          if (!_[index + 1]) {
            newSlice.push(now);
            now = null;
          }
        }
      });
    });
    console.log(newSlice);
    return newSlice;
  }, [selected]);
  const selectedText = useMemo(() => {
    const newText = new Array(7).fill(0).map(() => []);
    const fmt = (num) => (num < 10 ? `0${num}` : num);
    selectedSlice?.forEach((item) => {
      const start = `${item.hour}:${fmt(item.minute)}`;
      const dd = Math.floor(item.duration / 60);
      const dh = Math.floor((item.minute + dd) / 60);
      const dm = Math.floor((item.minute + dd) % 60);
      const end = `${item.hour + dh}:${fmt(dm)}`;
      newText[item.week].push(`${start}-${end}`);
    });
    return newText;
  }, [selectedSlice]);
  return [selected, setSelected, selectedSlice, selectedText];
};

const MultiTimeSelect = (
  { timeSlice, local = "zh", className, style },
  ref
) => {
  const maskRef = useRef(null);
  const tbRef = useRef(null);
  const p0 = useRef(null);
  const rAFId = useRef(null);
  const [selected, setSelected, selectedSlice, selectedText] =
    useTimeTransform(timeSlice);
  const handleMouseOver = useCallback((e) => {
    if (rAFId.current) cancelAnimationFrame(rAFId.current); //取消之前的动画帧回调
    rAFId.current = requestAnimationFrame(() => {
      //给mask设置最新的二维属性
      const p0c = p0.current;
      const mrc = maskRef.current;

      rAFId.current = null;
      p0c._row = e.target.getAttribute("data-row");
      p0c._col = e.target.getAttribute("data-col");
      const p1 = {
        x: e.target.offsetLeft,
        y: e.target.offsetTop,
        width: e.target.offsetWidth,
        height: e.target.offsetHeight,
      };
      const newSite = {
        left: Math.min(p0c.x, p1.x),
        top: Math.min(p0c.y, p1.y),
        width: Math.abs(p0c.x - p1.x) + (p0c.x > p1.x ? p0c.width : p1.width),
        height:
          Math.abs(p0c.y - p1.y) + (p0c.y > p1.y ? p0c.height : p1.height),
      };

      mrc.style.left = newSite.left + "px";
      mrc.style.top = newSite.top + "px";
      mrc.style.width = newSite.width + "px";
      mrc.style.height = newSite.height + "px";
    });
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      const p0c = p0.current;

      window.removeEventListener("mouseup", handleMouseUp);
      tbRef.current.removeEventListener("mouseover", handleMouseOver);

      const [col, row] = [
        e.target.getAttribute("data-col") ?? p0c._col,
        e.target.getAttribute("data-row") ?? p0c._row,
      ];
      const rect = {
        xs: Math.min(p0c.col, col),
        xe: Math.max(p0c.col, col) + 1,
        ys: Math.min(p0c.row, row),
        ye: Math.max(p0c.row, row) + 1,
      };
      let newSelected = selected.slice();
      for (let i = rect.ys; i < rect.ye; ++i) {
        if (!newSelected[i]) newSelected[i] = [];
        for (let j = rect.xs; j < rect.xe; ++j) {
          newSelected[i][j] = p0c.state;
        }
      }
      setSelected(newSelected);

      if (rAFId.current) cancelAnimationFrame(rAFId.current);
      requestAnimationFrame(() => {
        p0.current = null;
        rAFId.current = null;
        const mrc = maskRef.current;
        mrc.style.width = 0;
        mrc.style.height = 0;
        mrc.classList.remove("mask-ani");
      });
    },
    [handleMouseOver, selected, setSelected]
  );

  const handleMouseDown = useCallback(
    (e) => {
      p0.current = {
        x: e.target.offsetLeft,
        y: e.target.offsetTop,
        width: e.target.offsetWidth,
        height: e.target.offsetHeight,
        row: e.target.getAttribute("data-row"),
        col: e.target.getAttribute("data-col"),
        state: !e.target.className.includes("selectedTh"),
      };
      window.addEventListener("mouseup", handleMouseUp);
      tbRef.current.addEventListener("mouseover", handleMouseOver);

      requestAnimationFrame(() => {
        const p0c = p0.current;
        const mrc = maskRef.current;
        mrc.style.left = p0c.x + "px";
        mrc.style.top = p0c.y + "px";
        mrc.style.width = p0c.width + "px";
        mrc.style.height = p0c.height + "px";
        requestAnimationFrame(() => {
          //类名等下一帧添加，避免影响transition动画效果
          mrc.classList.add("mask-ani");
        });
      });
    },
    [handleMouseOver, handleMouseUp]
  );

  const tString = useMemo(() => {
    return new Array(7)
      .fill(0)
      .map((_, i) => `${weekStr[local][i]}: ${selectedText[i]?.join(" ")}\n`)
      .join("");
  }, [local, selectedText]);

  useImperativeHandle(ref, () => ({
    getSelected() {
      return selectedSlice;
    },
    clearSelected() {
      setSelected(null);
    },
  }));

  return (
    <SelectTable className={className} style={style}>
      <div ref={maskRef} className="select-mask"></div>
      <table title={tString}>
        <thead>
          <tr>
            <th rowSpan="2">
              <div className="table-header">
                <span className="y-axis">{axisStr[local].y}</span>
                <span className="x-axis">{axisStr[local].x}</span>
              </div>
            </th>
            <th colSpan={12 * colspan}>00:00~12:00</th>
            <th colSpan={12 * colspan}>12:00~24:00</th>
          </tr>
          <tr>
            {[...Array(24)].map((_, i) => (
              <td colSpan={colspan} key={"hour-" + i}>
                {i}
              </td>
            ))}
          </tr>
        </thead>
        <tbody ref={tbRef} onMouseDown={handleMouseDown}>
          {[...Array(7)].map((_, i) => (
            <tr key={"day-" + i}>
              <td className="row-head">{weekStr[local][i]}</td>
              {[...Array(24 * colspan)].map((_, j) => (
                <td
                  className={selected?.[i]?.[j] ? "selectedTh" : "selectTh"}
                  key={i * 24 * colspan + j}
                  data-row={i}
                  data-col={j}
                ></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SelectTable>
  );
};

export default memo(forwardRef(MultiTimeSelect));
