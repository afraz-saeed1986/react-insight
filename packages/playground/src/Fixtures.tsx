import {
  Component,
  type ForwardedRef,
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

const bodyCalls: Record<string, number> = {};

// برای خواندن مقدار زنده‌ی شمارنده از کنسول مرورگر؛ متن روی صفحه فقط در رندر
// بعدی به‌روز می‌شود و برای اندازه‌گیری inspection قابل اتکا نیست.
(globalThis as { __riFixtureCalls?: Record<string, number> }).__riFixtureCalls =
  bodyCalls;

/** تعداد واقعی اجرای بدنه‌ی هر کامپوننت؛ حقیقت مبنا برای مقایسه با ×N پنل. */
function countBodyCall(name: string): number {
  const next = (bodyCalls[name] ?? 0) + 1;
  bodyCalls[name] = next;
  return next;
}

// انتظار: ۳ hook => useState, useState, useReducer
function FixtureState() {
  const calls = countBodyCall("FixtureState");
  const [n, setN] = useState(0);
  const [label] = useState("a");
  const [r, dispatch] = useReducer((s: number, a: number) => s + a, 10);

  return (
    <div>
      <b>FixtureState</b> calls={calls} n={n} label={label} r={r}{" "}
      <button type="button" onClick={() => setN(n + 1)}>
        n+1
      </button>{" "}
      <button type="button" onClick={() => dispatch(5)}>
        r+5
      </button>
    </div>
  );
}

// انتظار: ۶ hook => useRef, useMemo, useCallback, useId, useEffect, useLayoutEffect
function FixtureMisc() {
  const calls = countBodyCall("FixtureMisc");
  const ref = useRef(42);
  const doubled = useMemo(() => 21 * 2, []);
  const cb = useCallback(() => 1, []);
  const id = useId();

  useEffect(() => {
    ref.current += 1;
  }, []);
  useLayoutEffect(() => {
    document.body.dataset["riFixture"] = "1";
  }, []);

  return (
    <div>
      <b>FixtureMisc</b> calls={calls} memo={doubled} cb={cb()} id={id}
    </div>
  );
}

function useToggle(initial: boolean) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle] as const;
}

// انتظار: ۳ hook => useState ← useToggle, useCallback ← useToggle, useState
function FixtureCustom() {
  const calls = countBodyCall("FixtureCustom");
  const [on, toggle] = useToggle(false);
  const [count] = useState(7);

  return (
    <div>
      <b>FixtureCustom</b> calls={calls} on={String(on)} count={count}{" "}
      <button type="button" onClick={toggle}>
        toggle
      </button>
    </div>
  );
}

const ColorContext = createContext("red");
ColorContext.displayName = "ColorContext";
const SizeContext = createContext(10);
SizeContext.displayName = "SizeContext";

// انتظار: ۰ hook و ۲ context => ColorContext = "blue", SizeContext = 10
function FixtureContext() {
  const calls = countBodyCall("FixtureContext");
  const color = useContext(ColorContext);
  const size = useContext(SizeContext);

  return (
    <div>
      <b>FixtureContext</b> calls={calls} color={color} size={size}
    </div>
  );
}

function FixtureMemoChild({ label }: { label: string }) {
  const calls = countBodyCall("FixtureMemoChild");
  return (
    <span>
      {label} calls={calls}
    </span>
  );
}
const MemoizedChild = memo(FixtureMemoChild);

function FixtureForwardRef(
  { text }: { text: string },
  ref: ForwardedRef<HTMLSpanElement>,
) {
  const calls = countBodyCall("FixtureForwardRef");
  return (
    <span ref={ref}>
      {text} calls={calls}
    </span>
  );
}
const ForwardedFixture = forwardRef(FixtureForwardRef);

// انتظار: با هر tick، Parent و ForwardRef بالا می‌روند ولی MemoChild ثابت می‌ماند
function FixtureMemoParent() {
  const calls = countBodyCall("FixtureMemoParent");
  const [tick, setTick] = useState(0);

  return (
    <div>
      <b>FixtureMemoParent</b> calls={calls} tick={tick}{" "}
      <button type="button" onClick={() => setTick(tick + 1)}>
        tick
      </button>{" "}
      <MemoizedChild label="stable" /> <ForwardedFixture text="fwd" />
    </div>
  );
}

// انتظار: ۰ hook و "Hook names unavailable" بعد از Re-inspect
class FixtureClass extends Component {
  override render() {
    const calls = countBodyCall("FixtureClass");
    return (
      <div>
        <b>FixtureClass</b> calls={calls}
      </div>
    );
  }
}

function FixtureEphemeral() {
  const calls = countBodyCall("FixtureEphemeral");
  return <span>FixtureEphemeral calls={calls}</span>;
}

function FixtureMount() {
  const [shown, setShown] = useState(true);

  return (
    <div>
      <button type="button" onClick={() => setShown((v) => !v)}>
        {shown ? "unmount" : "mount"}
      </button>{" "}
      {shown && <FixtureEphemeral />}
    </div>
  );
}

// مقدارهای لبه برای تست سریالایز؛ فقط با دکمه‌ی opt-in نمایش داده می‌شود
function FixtureValues() {
  const [obj] = useState({ a: 1, b: [1, 2, 3] });
  const [circular] = useState(() => {
    const o: { self?: unknown } = {};
    o.self = o;
    return o;
  });
  const [big] = useState(() => BigInt(10));
  const [fn] = useState(() => () => 1);
  const [sym] = useState(() => Symbol("s"));
  const [date] = useState(() => new Date(0));
  const [nul] = useState<null>(null);
  const [undef] = useState<undefined>(undefined);
  const [long] = useState(() => "x".repeat(5000));

  const kinds = [obj, circular, big, fn, sym, date, nul, undef, long]
    .map((v) => typeof v)
    .join(" ");

  return (
    <div>
      <b>FixtureValues</b> {kinds}
    </div>
  );
}

export function Fixtures() {
  const [showValues, setShowValues] = useState(false);

  return (
    <section style={{ marginTop: 16, display: "grid", gap: 8, paddingBottom: 360 }}>
      <h3>Fixtures (ground truth)</h3>
      <FixtureState />
      <FixtureMisc />
      <FixtureCustom />
      <ColorContext.Provider value="blue">
        <FixtureContext />
      </ColorContext.Provider>
      <FixtureMemoParent />
      <FixtureClass />
      <FixtureMount />
      <div>
        <button type="button" onClick={() => setShowValues((v) => !v)}>
          {showValues ? "Hide value edge cases" : "Show value edge cases"}
        </button>
      </div>
      {showValues && <FixtureValues />}
    </section>
  );
}