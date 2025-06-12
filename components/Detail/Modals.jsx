// import {
//     Modal,
//     ModalOverlay,
//     ModalContent,
//     ModalHeader,
//     ModalFooter,
//     ModalBody,
//     ModalCloseButton,
//     useDisclosure,
//     Button
// } from '@chakra-ui/react'
import { website } from '@/libs/config/siteConfig'
import { Dialog, Transition } from '@headlessui/react';
// import { Transition } from '@headlessui/react/transition'
import { Fragment, useState } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/router'

import { EmailShareButton, PinterestShareButton, TwitterShareButton, FacebookShareButton, WhatsappShareButton } from 'react-share'

export default function Modals({ headerCss }) {
    const router = useRouter()
    // const { isOpen, onOpen, onClose } = useDisclosure()
    let [isOpen, setIsOpen] = useState(false)

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }
    return (
        <>
            {/* <Button onClick={onOpen}>Open Modal</Button> */}
            {/* <div onClick={onOpen} className={`${headerCss ? headerCss : 'h-[36px] w-[60px] light_bg rounded-[5px] grid place-content-center'}`}><Image className='cursor-pointer object-contain h-[25px] w-[30px]' src={'/detail/share.svg'} height={100} width={200} alt='share' /></div> */}
            <div onClick={openModal} className={`${headerCss ? headerCss : 'h-[36px] w-[60px] light_bg rounded-[5px] grid place-content-center'}`}><Image className='cursor-pointer object-contain h-[25px] w-[30px]' src={'/detail/share.svg'} height={100} width={200} alt='share' /></div>

            {/* <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader className='p-[6px_10px]'>Share this product</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className=''>
                            <input type='url' value={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='border-b border-[#ddd] w-full overflow-auto' />
                            <EmailShareButton
                                url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/gmail-01.svg'} className='h-[32px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>Email</p>
                            </EmailShareButton>

                            <WhatsappShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/Whatapp.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>WhatApp</p>
                            </WhatsappShareButton>

                            <FacebookShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/facebook-01.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>Facebook</p>
                            </FacebookShareButton>

                            <TwitterShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/twitter-01.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>Twitter</p>
                            </TwitterShareButton>

                            <PinterestShareButton
                                url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} media={''} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/pinterest-01.svg'} className='h-[30px] object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>Pinterest</p>
                            </PinterestShareButton>
                        </div>
                    </ModalBody>

                   
                </ModalContent>
            </Modal> */}

            {/* <div className="fixed inset-0 flex items-center justify-center">
                <button
                    type="button"
                    onClick={openModal}
                    className="rounded-md bg-black/20 px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                >
                    Open dialog
                </button>
            </div> */}

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[5px] bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Share this product
                                    </Dialog.Title>
                                    <div className=''>
                                        <div onClick={closeModal} className={`absolute top-[10px] right-[10px] cursor-pointer`}>
                                            <Image className={`h-[18px]`} src={'/cancel.svg'} height={20} width={20} alt={'close button'} />
                                        </div>
                                        <input type='url' value={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='border-b border-[#ddd] w-full overflow-auto my-[10px]' />
                                        <EmailShareButton
                                            url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                            <div className=''><Image src={'/detail/gmail-01.svg'} className='h-[32px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                            <p className={'text-[14px]'}>Email</p>
                                        </EmailShareButton>

                                        {/* <InstapaperShareButton ShareButton url={website + '/'  + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                <div className=''><Image src={'/detail/Instagram.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                <p className={'text-[14px]'}>Twitter</p>
                            </InstapaperShareButton> */}

                                        <WhatsappShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                            <div className=''><Image src={'/detail/Whatapp.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                            <p className={'text-[14px]'}>WhatsApp</p>
                                        </WhatsappShareButton>

                                        <FacebookShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                            <div className=''><Image src={'/detail/facebook-01.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                            <p className={'text-[14px]'}>Facebook</p>
                                        </FacebookShareButton>

                                        <TwitterShareButton url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} className='flex items-center gap-[10px] mt-[10px]'>
                                            <div className=''><Image src={'/detail/twitter-01.svg'} className='h-[30px]  object-contain' height={40} width={40} alt={'imgs'} /></div>
                                            <p className={'text-[14px]'}>Twitter</p>
                                        </TwitterShareButton>

                                        <PinterestShareButton
                                            url={website + '/' + router.asPath.split('/')[1] + '/' + router.asPath.split('/')[2]} media={''} className='flex items-center gap-[10px] mt-[10px]'>
                                            <div className=''><Image src={'/detail/pinterest-01.svg'} className='h-[30px] object-contain' height={40} width={40} alt={'imgs'} /></div>
                                            <p className={'text-[14px]'}>Pinterest</p>
                                        </PinterestShareButton>
                                    </div>


                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>

    )
}