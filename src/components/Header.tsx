"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"

export function Header() {
  const [isAboutOpen, setIsAboutOpen] = React.useState(false)

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-end p-4">
          <Dialog.Root open={isAboutOpen} onOpenChange={setIsAboutOpen}>
            <Dialog.Trigger asChild>
              <button className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200" type="button">
                About
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <Dialog.Title className="text-2xl font-bold mb-4 text-indigo-700">
                  About Passkey Authentication
                </Dialog.Title>
                <Dialog.Description className="text-gray-600 mb-4">
                  Passkeys are a safer and easier replacement for passwords. They use cryptographic key pairs to provide
                  strong authentication without the need to remember complex passwords.
                </Dialog.Description>
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label="Close"
                    type="button"
                  >
                    <Cross2Icon />
                  </button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  )
}

