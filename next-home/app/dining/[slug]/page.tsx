import Page, { generateMetadata as metadata } from '../../[...path]/page';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string; status?: string }> };
export const dynamic = 'force-dynamic';
async function adapt(props: Props) { return { ...props, params: Promise.resolve({ path: ['dining', (await props.params).slug] }) }; }
export async function generateMetadata(props: Props) { return metadata(await adapt(props)); }
export default async function DiningPage(props: Props) { return Page(await adapt(props)); }
