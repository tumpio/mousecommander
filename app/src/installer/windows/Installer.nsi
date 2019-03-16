
!define FULLNAME "Mouse Commander Native Client"
!define APPNAME "mousecommander"


!include MUI2.nsh
!include FileFunc.nsh

;--------------------------------
;Perform Machine-level install, if possible

!define MULTIUSER_EXECUTIONLEVEL Highest
;Add support for command-line args that let uninstaller know whether to
;uninstall machine- or user installation:
!define MULTIUSER_INSTALLMODE_COMMANDLINE
!include MultiUser.nsh
!include LogicLib.nsh

Function .onInit
  !insertmacro MULTIUSER_INIT
  ;Do not use InstallDir at all so we can detect empty $InstDir!
  ${If} $InstDir == "" ; /D not used
      ${If} $MultiUser.InstallMode == "AllUsers"
          StrCpy $InstDir "$PROGRAMFILES\${FULLNAME}"
      ${Else}
          StrCpy $InstDir "$LOCALAPPDATA\${FULLNAME}"
      ${EndIf}
  ${EndIf}
FunctionEnd

Function un.onInit
  !insertmacro MULTIUSER_UNINIT
FunctionEnd

;--------------------------------
;General

  Name "${FULLNAME}"
  OutFile "..\${APPNAME}-client-setup.exe"

;--------------------------------
;Interface Settings

  !define MUI_ABORTWARNING

;--------------------------------
;Pages

  !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of ${FULLNAME}.$\r$\n$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
    !define MUI_FINISHPAGE_NOAUTOCLOSE
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_CHECKED
    !define MUI_FINISHPAGE_RUN_TEXT "Run ${FULLNAME}"
    !define MUI_FINISHPAGE_RUN_FUNCTION "LaunchLink"
  !insertmacro MUI_PAGE_FINISH

  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
;Languages

  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

!define UNINST_KEY \
  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${FULLNAME}"
!define MANIFEST_KEY \
  "Software\Mozilla\NativeMessagingHosts\${APPNAME}"
Section
  SetOutPath "$InstDir"
  File /r "..\${APPNAME}\*"
  nsJSON::Set /file "$InstDir\${APPNAME}.json"
  nsJSON::Quote /always `$InstDir\${APPNAME}.exe`
  Pop $R0
  nsJSON::Set `path` /value `$R0`
  nsJSON::Serialize /format /file "$InstDir\${APPNAME}.json"
  WriteRegStr SHCTX "${MANIFEST_KEY}" "" "$InstDir\${APPNAME}.json"
  WriteRegStr SHCTX "Software\${FULLNAME}" "" $InstDir
  WriteUninstaller "$InstDir\uninstall.exe"
  CreateShortCut "$SMPROGRAMS\${FULLNAME}.lnk" "$InstDir\${APPNAME}.exe"
  WriteRegStr SHCTX "${UNINST_KEY}" "DisplayName" "${FULLNAME}"
  WriteRegStr SHCTX "${UNINST_KEY}" "DisplayIcon" "$InstDir\${APPNAME}.exe"
  WriteRegStr SHCTX "${UNINST_KEY}" "UninstallString" \
    "$\"$InstDir\uninstall.exe$\" /$MultiUser.InstallMode"
  WriteRegStr SHCTX "${UNINST_KEY}" "QuietUninstallString" \
    "$\"$InstDir\uninstall.exe$\" /$MultiUser.InstallMode /S"
  WriteRegStr SHCTX "${UNINST_KEY}" "Publisher" "tumpio"
  ${GetSize} "$InstDir" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD SHCTX "${UNINST_KEY}" "EstimatedSize" "$0"

SectionEnd

;--------------------------------
;Uninstaller Section

Section "Uninstall"

  RMDir /r "$InstDir"
  Delete "$SMPROGRAMS\${FULLNAME}.lnk"
  DeleteRegKey /ifempty SHCTX "Software\${FULLNAME}"
  DeleteRegKey SHCTX "${MANIFEST_KEY}"
  DeleteRegKey SHCTX "${UNINST_KEY}"

SectionEnd

Function LaunchLink
  !addplugindir "."
  ShellExecAsUser::ShellExecAsUser "open" "$SMPROGRAMS\${FULLNAME}.lnk"
FunctionEnd