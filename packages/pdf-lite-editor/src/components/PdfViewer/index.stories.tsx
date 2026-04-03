import type { Meta, StoryObj } from '@storybook/react-vite'
import { PdfViewer } from '.'
import DummyPDF from './dummy.stories.pdf'

const meta: Meta<typeof PdfViewer> = {
    component: PdfViewer,
    parameters: {},
}

type Story = StoryObj<typeof PdfViewer>

export default meta

export const Default: Story = {
    args: {
        className:
            'w-[500px] h-[200px] bg-gray-200 text-center self-center overflow-auto',
        file: DummyPDF,
        pageWrapper: (page, { pageNumber }) => (
            <div className="border border-gray-400 my-4">
                Page: {pageNumber}
                {page}
            </div>
        ),
    },
    render: (args) => (
        <PdfViewer {...args} />
    ),
}
