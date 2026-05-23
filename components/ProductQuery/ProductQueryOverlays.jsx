import { useSelector, useDispatch } from "react-redux";
import {
  closeQueryChat,
  closeRaiseQuery,
  openQueryChat,
  bumpQueryRefresh,
} from "@/redux/slice/productQuerySlice";
import RaiseQueryModal from "./RaiseQueryModal";
import ChatDrawer from "./ChatDrawer";

/**
 * Global overlays for the Product Query Desk. Mounted once (in RootLayout) so any
 * product surface can open the "raise query" modal or the chat drawer purely via
 * Redux actions (openRaiseQuery / openQueryChat).
 */
export default function ProductQueryOverlays() {
  const dispatch = useDispatch();
  const { raiseModalOpen, pendingProduct, drawerOpen, activeQueryId } = useSelector(
    (state) => state.productQuery
  );

  return (
    <>
      <RaiseQueryModal
        open={raiseModalOpen}
        product={pendingProduct}
        onClose={() => dispatch(closeRaiseQuery())}
        onCreated={(detail) => {
          dispatch(closeRaiseQuery());
          dispatch(bumpQueryRefresh());
          const id = detail?.query?.id;
          if (id) dispatch(openQueryChat(id));
        }}
      />
      <ChatDrawer
        open={drawerOpen}
        queryId={activeQueryId}
        onClose={() => dispatch(closeQueryChat())}
      />
    </>
  );
}
