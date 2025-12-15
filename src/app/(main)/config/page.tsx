
import { ConfigForm } from "@/components/forms/config-form"
import { ProfilesList } from "@/components/forms/profiles-list"
import { MarkupsList } from "@/components/forms/markups-list"

export default function ConfigPage() {
    return (
        <div className="space-y-6 pb-20">
            <ConfigForm />
            <MarkupsList />
            <ProfilesList />
        </div>
    )
}
