import { useState } from "react";
import { TopNavigation } from "@cloudscape-design/components";
import { Mode } from "@cloudscape-design/global-styles";
import { StorageHelper } from "../common/helpers/storage-helper";
import { APP_NAME } from "../common/constants";
import { useGlobalFilters } from "../common/contexts/GlobalFilterContext";

export default function GlobalHeader() {
  const [theme, setTheme] = useState<Mode>(StorageHelper.getTheme());
  const {
    selectedYear,
    setSelectedYear,
    availableYears,
    selectedEnvironment,
    setSelectedEnvironment,
    availableEnvironments,
    selectedNarrowEnvironment,
    setSelectedNarrowEnvironment,
    availableNarrowEnvironments,
    loadingFilters,
  } = useGlobalFilters();

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
                setSelectedYear(parseInt(detail.id, 10));
              }
            },
          },
          {
            type: "menu-dropdown",
            text: loadingFilters ? 'Environment: Loading...' : `Environment: ${selectedEnvironment}`,
            items: availableEnvironments.map((env) => ({ id: env, text: env })),
            onItemClick: ({ detail }) => setSelectedEnvironment(detail.id),
          },
          {
            type: "menu-dropdown",
            text: loadingFilters ? 'Narrow Env: Loading...' : `Narrow Env: ${selectedNarrowEnvironment}`,
            items: availableNarrowEnvironments.map((env) => ({ id: env, text: env })),
            onItemClick: ({ detail }) => setSelectedNarrowEnvironment(detail.id),
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
