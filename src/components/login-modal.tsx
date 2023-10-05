// Copyright (c) 2023, NeKz
// SPDX-License-Identifier: MIT

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/modal';
import { Listbox, ListboxItem, ListboxSection } from '@nextui-org/listbox';
import { Button } from '@nextui-org/button';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} backdrop="blur" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Login with</ModalHeader>
            <ModalBody>
              <Listbox aria-label="Actions" onAction={(key) => alert(key)}>
                <ListboxItem key="ubisoft">Ubisoft Connect</ListboxItem>
                <ListboxItem key="maniaplanet">Maniaplanet</ListboxItem>
              </Listbox>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
