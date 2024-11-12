import { app, Menu } from 'electron';

export const createMenu = () => {
  const template = [
    {
      label: '&File',
      submenu: [
        {
          label: '&Open Character',
          accelerator: 'Alt+O',
          click: () => {
            console.log('Open clicked');
          },
        },
        { type: 'separator' },
        {
          label: 'E&xit',
          accelerator: 'Alt+X',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: '&Font',
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
