import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { useState } from "react";
import { useOnFollow } from "../common/hooks/use-on-follow";
import { APP_NAME } from "../common/constants";
import { useLocation } from "react-router-dom";

export default function NavigationPanel() {
  const location = useLocation();
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();

  const [items] = useState<SideNavigationProps.Item[]>(() => {
    const items: SideNavigationProps.Item[] = [
      {
        type: "link",
        text: "Dashboard",
        href: "/",
      },
      {
        type: "section",
        text: "AWS",
        items: [{ type: "link", text: "SecOps Reports", href: "/aws/secops-reports" }],
      },
      {
        type: "section",
        text: "GCP",
        items: [
          { type: "link", text: "SecOps Reports", href: "/gcp/secops-reports" },
        ],
      },
      {
        type: "section",
        text: "Agents",
        items: [
          { type: "link", text: "AWS", href: "/agents/aws" },
          { type: "link", text: "GCP", href: "/agents/gcp" },
        ],
      },
      {
        type: "section",
        text: "Whitepapers",
        items: [
          {
            type: "link",
            text: "Confluence Viewer",
            href: "/whitepapers/confluence",
          },
        ],
      },
      {
        type: "section",
        text: "ArchitectureToCode (ATC)",
        items: [
          { type: "link", text: "AWS", href: "/atc/aws" },
          { type: "link", text: "GCP", href: "/atc/gcp" },
        ],
      },
    ];

    items.push(
      { type: "divider" },
      {
        type: "link",
        text: "Documentation",
        href: "https://github.com/aws-samples/cloudscape-examples",
        external: true,
      }
    );

    return items;
  });

  const onChange = ({
    detail,
  }: {
    detail: SideNavigationProps.ChangeDetail;
  }) => {
    const sectionIndex = items.indexOf(detail.item);
    setNavigationPanelState({
      collapsedSections: {
        ...navigationPanelState.collapsedSections,
        [sectionIndex]: !detail.expanded,
      },
    });
  };

  return (
    <SideNavigation
      onFollow={onFollow}
      onChange={onChange}
      header={{ href: "/", text: APP_NAME }}
      activeHref={location.pathname}
      items={items.map((value, idx) => {
        if (value.type === "section") {
          const collapsed =
            navigationPanelState.collapsedSections?.[idx] === true;
          value.defaultExpanded = !collapsed;
        }

        return value;
      })}
    />
  );
}
