import { createContext, useContext } from 'react';

/** 모달이 렌더링될 컨테이너 요소 (게임 테이블 영역) */
export const ModalContainerContext = createContext<HTMLElement | null>(null);

export function useModalContainer() {
  return useContext(ModalContainerContext);
}
