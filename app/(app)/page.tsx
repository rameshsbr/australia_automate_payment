import { redirect } from "next/navigation";

/** WHY: Home should land on Summary. */
export default function Index() {
  redirect("/summary");
}
