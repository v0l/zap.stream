import { ProfileEditor } from "@/element/profile-editor"
import { DashboardCard } from "@/pages/dashboard/card"
import { FormattedMessage } from "react-intl"

export default function ProfileSettings() {
  return (
    <DashboardCard title={<FormattedMessage defaultMessage="Profile" />}>
      <ProfileEditor onClose={() => {}} />
    </DashboardCard>
  )
}
