import { useState } from "react";
import { TopNavigation } from "@cloudscape-design/components";
import { Mode } from "@cloudscape-design/global-styles";
import { StorageHelper } from "../common/helpers/storage-helper";
import { APP_NAME } from "../common/constants";
import { useYearFilter } from "../common/contexts/year-filter-context";

export default function GlobalHeader() {
  const [theme, setTheme] = useState<Mode>(StorageHelper.getTheme());
  const { selectedYear, setSelectedYear, availableYears } = useYearFilter();

  const onChangeThemeClick = () => {
    if (theme === Mode.Dark) {
      setTheme(StorageHelper.applyTheme(Mode.Light));
    } else {
      setTheme(StorageHelper.applyTheme(Mode.Dark));
    }
  };

  return (
    <div
      style={{ zIndex: 1002, top: 0, left: 0, right: 0, position: "fixed" }}
      id="awsui-top-navigation"
    >
      <TopNavigation
        identity={{
          href: "/",
          logo: { src: "/images/logo.png", alt: `${APP_NAME} Logo` },
        }}
        utilities={[
          {
            type: "menu-dropdown",
            text: `Year: ${selectedYear}`,
            items: availableYears.map((year) => ({
              id: year.toString(),
              text: year.toString(),
            })),
            onItemClick: ({ detail }) => {
              if (detail.id) {
                const newYear = parseInt(detail.id, 10);
                console.log('New year selected:', newYear);
                setSelectedYear(newYear);
              }
            },
          },
          {
            type: "button",
            text: theme === Mode.Dark ? "Light Mode" : "Dark Mode",
            onClick: onChangeThemeClick,
          },
        ]}
      />
    </div>
  );
}
