// Stub for every @mysten/* import. Solpack restricts LI.FI to EVM + SVM,
// but @lifi/sdk and @lifi/wallet-management still import @mysten/* code
// (Sui) at module load time. We replace those imports with this no-op so
// nothing Sui actually ships or runs.
//
// Different export shapes are needed depending on how the consumer uses
// the symbol:
//   - React components (PascalCase, e.g. WalletProvider): a function that
//     renders its children (or null) — never `undefined`, or React errors.
//   - Hooks (`useXxx`): return a stable object with mutate/mutateAsync/etc.
//     so destructuring doesn't throw.
//   - Plain helpers (lowercase, e.g. `isValidSuiAddress`): a function that
//     returns `false` / `null` so logic short-circuits.
//
// The Proxy below dispatches to one of those shapes based on the symbol
// name being requested.

const NoopComponent = function NoopMystenStub(props) {
  return props && props.children ? props.children : null;
};

const noopHookResult = {
  mutate: () => {},
  mutateAsync: async () => {},
  data: undefined,
  error: null,
  isError: false,
  isPending: false,
  isLoading: false,
  isSuccess: false,
  status: "idle",
  reset: () => {},
};

const noopHook = () => noopHookResult;
const noopHelper = () => false;

function pick(name) {
  if (typeof name !== "string") return undefined;
  if (name === "default") return NoopComponent;
  if (name === "__esModule") return true;
  if (/^[A-Z]/.test(name)) return NoopComponent;        // <Component />
  if (/^use[A-Z]/.test(name)) return noopHook;          // useXxx hooks
  return noopHelper;                                     // helpers / utils
}

const stubProxy = new Proxy(
  function MystenStub(props) {
    return props && props.children ? props.children : null;
  },
  {
    get(_target, prop) {
      return pick(prop);
    },
  },
);

module.exports = stubProxy;
module.exports.default = stubProxy;
